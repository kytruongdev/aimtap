import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { loadAppConfig, type AppConfig } from '../../registry/index.js';
import {
  createCodeAgent,
  generateTestCase,
  type CodeAgent,
  type GenerateContext,
  type GenerateOutcome,
} from '../../ai/index.js';

// TICKET-043 (US-8.2, ADR-017/025, sequence-diagrams §2): `aimtap generate <app-id>`. QC gives a
// plain-language behaviour and a page source; the platform asks the AI Gateway to draft a test case
// (US-8.1). The per-app AI switch (AppConfig.ai.enabled, BR-209) gates the call: when AI is off the
// command does not touch the CLI and tells QC to author the test manually as in Phase 1 (BR-218).
// The orchestration and on/off branch are unit-tested with a fake AI Gateway; the real CLI call that
// writes draft files is verified manually (conventions §3.1).

// One-shot generate: a single CLI call bounded by a hard timeout (mirrors the run-assembly control
// point; a subprocess timeout is a hard bound, not a conditional device wait, so it is a platform
// default here rather than a wait-policy value).
const GENERATE_MAX_CALLS = 1;
const GENERATE_CALL_TIMEOUT_MS = 300_000;

const AI_OFF_MESSAGE = (appId: string): string =>
  `AI is off for "${appId}"; author the test case manually as in Phase 1.`;

export interface GenerateInput {
  appId: string;
  description: string;
  pageSourcePath: string;
}

export interface GenerateDeps {
  loadAppConfig(appId: string): Promise<AppConfig>;
  /** Read a UTF-8 text file (page source, or a --description-file). */
  readFile(path: string): string;
  /** Existing step sentences for the app, so the CLI reuses them before inventing new ones (BR-212). */
  readExistingSteps(appId: string): string[];
  generate(agent: CodeAgent, ctx: GenerateContext): Promise<GenerateOutcome>;
  /** Build the AI Gateway whose CLI runs in appDir, so draft files land under apps/<app-id>/. */
  createAgent(appDir: string): CodeAgent;
  print(line: string): void;
}

/** Pure logic returning an exit code so the on/off branch and orchestration are unit-testable. */
export async function runGenerate(input: GenerateInput, deps: GenerateDeps): Promise<number> {
  let appConfig: AppConfig;
  try {
    appConfig = await deps.loadAppConfig(input.appId);
  } catch (error) {
    deps.print(error instanceof Error ? error.message : String(error));
    return 1;
  }

  // AI off for this app is a valid path, not an error: do not call the CLI (BR-209/BR-218).
  if (!appConfig.ai.enabled) {
    deps.print(AI_OFF_MESSAGE(input.appId));
    return 0;
  }

  let pageSource: string;
  try {
    pageSource = deps.readFile(input.pageSourcePath);
  } catch (error) {
    deps.print(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const ctx: GenerateContext = {
    description: input.description,
    pageSource,
    existingSteps: deps.readExistingSteps(input.appId),
  };

  // Run the CLI in the app directory so limited-write drafts land under apps/<app-id>/ (TICKET-043).
  const agent = deps.createAgent(join('apps', input.appId));
  const outcome = await deps.generate(agent, ctx);
  if (!outcome.ok) {
    deps.print(`Generation did not run: ${outcome.reason}`);
    return 1;
  }

  deps.print('Draft files created:');
  for (const path of outcome.draftPaths) deps.print(`  - ${path}`);
  deps.print(
    'Next: run the drafts, confirm they match the described behaviour, then open a pull request for review.',
  );
  return 0;
}

/** Resolve the behaviour from --description <text> or --description-file <path>; null when neither. */
export function resolveDescription(
  opts: { description?: string; descriptionFile?: string },
  readFile: (path: string) => string,
): string | null {
  if (opts.descriptionFile !== undefined) return readFile(opts.descriptionFile);
  if (opts.description !== undefined) return opts.description;
  return null;
}

/** Extract the Gherkin sentences from a step-definition file's Given/When/Then calls. */
export function extractStepSentences(content: string): string[] {
  const pattern = /\b(?:Given|When|Then)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
  const sentences: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const sentence = match[2];
    if (sentence !== undefined) sentences.push(sentence);
  }
  return sentences;
}

/** Read the app's step sentences from apps/<app-id>/steps/*.steps.ts at runtime (never imports apps/). */
function readExistingSteps(appId: string): string[] {
  const dir = join('apps', appId, 'steps');
  let files: string[];
  try {
    files = readdirSync(dir).filter((name) => name.endsWith('.steps.ts'));
  } catch {
    return [];
  }

  const sentences: string[] = [];
  for (const file of files) {
    try {
      sentences.push(...extractStepSentences(readFileSync(join(dir, file), 'utf8')));
    } catch {
      // A steps file that cannot be read is skipped; reuse is best-effort.
    }
  }
  return sentences;
}

function withDefaults(deps?: Partial<GenerateDeps>): GenerateDeps {
  return {
    loadAppConfig: deps?.loadAppConfig ?? loadAppConfig,
    readFile: deps?.readFile ?? ((path) => readFileSync(path, 'utf8')),
    readExistingSteps: deps?.readExistingSteps ?? readExistingSteps,
    generate: deps?.generate ?? generateTestCase,
    createAgent:
      deps?.createAgent ??
      ((appDir) =>
        createCodeAgent({
          cli: 'claude-code',
          limits: { maxCallsPerRun: GENERATE_MAX_CALLS, callTimeoutMs: GENERATE_CALL_TIMEOUT_MS },
          cwd: appDir,
        })),
    print: deps?.print ?? ((line) => process.stdout.write(`${line}\n`)),
  };
}

export function generateCommand(deps?: Partial<GenerateDeps>): Command {
  return new Command('generate')
    .argument('<app-id>', 'the app to generate a test case for (apps/<app-id>)')
    .requiredOption('--page-source <path>', 'file holding the screen accessibility page source')
    .option('--description <text>', 'the behaviour to cover, in plain language')
    .option('--description-file <path>', 'file holding the behaviour to cover')
    .action(
      async (
        appId: string,
        opts: { pageSource: string; description?: string; descriptionFile?: string },
      ) => {
        const resolved = withDefaults(deps);

        let description: string | null;
        try {
          description = resolveDescription(opts, resolved.readFile);
        } catch (error) {
          resolved.print(error instanceof Error ? error.message : String(error));
          process.exitCode = 1;
          return;
        }
        if (description === null) {
          resolved.print('Provide --description <text> or --description-file <path>.');
          process.exitCode = 1;
          return;
        }

        process.exitCode = await runGenerate(
          { appId, description, pageSourcePath: opts.pageSource },
          resolved,
        );
      },
    );
}
