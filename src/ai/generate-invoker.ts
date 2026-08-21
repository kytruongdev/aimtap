import { z } from 'zod';
import type { CodeAgent } from './code-agent.js';
import { buildGeneratePrompt, type GeneratePromptContext } from './prompts/generate.js';

// Generate invoker: build the generate prompt, call the CodeAgent in limited-write mode, and report
// which draft files it created. The CLI output is parsed through Zod (external data). Any failure —
// AI off/error, or output that lists no draft files — returns { ok: false } rather than throwing, so
// generation simply does not happen this time (BR-208). Never logs the description or page source.

const generateOutputSchema = z.object({ files: z.array(z.string().min(1)).min(1) });

export type GenerateContext = GeneratePromptContext;

export type GenerateOutcome =
  | { ok: true; draftPaths: string[] }
  | { ok: false; reason: string };

export async function generateTestCase(
  agent: CodeAgent,
  ctx: GenerateContext,
): Promise<GenerateOutcome> {
  const result = await agent.invoke('generate', buildGeneratePrompt(ctx));
  if (result === null) return { ok: false, reason: 'AI CLI unavailable or returned no result' };

  let raw: unknown;
  try {
    raw = JSON.parse(result);
  } catch {
    return { ok: false, reason: 'AI CLI returned malformed output' };
  }

  const parsed = generateOutputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'AI CLI output did not list any draft files' };

  return { ok: true, draftPaths: parsed.data.files };
}
