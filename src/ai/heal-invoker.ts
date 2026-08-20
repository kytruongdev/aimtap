import { z } from 'zod';
import { LOCATOR_STRATEGIES, type Locator } from '../shared/index.js';
import type { CodeAgent } from './code-agent.js';
import { buildHealPrompt, type HealPromptContext } from './prompts/heal.js';

// Heal invoker: build the heal prompt, call the CodeAgent in read-only mode, and parse its result
// into a Locator. The Locator type comes from the shared kernel (ADR-027) and the object is built
// directly from the Zod-validated { strategy, selector } — the AI Gateway does not depend on the
// Locator module, and does not use the iOS builders. Any failure (AI off/error, or malformed output)
// yields null so the caller falls back to a normal Phase 1 failure (BR-208). Never throws; never logs
// the page source or prompt.

const healOutputSchema = z.object({
  strategy: z.enum(LOCATOR_STRATEGIES),
  selector: z.string().min(1),
});

export type HealContext = HealPromptContext;

export async function healLocator(agent: CodeAgent, ctx: HealContext): Promise<Locator | null> {
  const result = await agent.invoke('heal', buildHealPrompt(ctx));
  if (result === null) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(result);
  } catch {
    return null;
  }

  const parsed = healOutputSchema.safeParse(raw);
  if (!parsed.success) return null;

  return { strategy: parsed.data.strategy, value: parsed.data.selector };
}
