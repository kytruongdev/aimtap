import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import type { AppConfig } from '../../registry/index.js';
import type { CodeAgent, GenerateContext, GenerateOutcome } from '../../ai/index.js';
import {
  runGenerate,
  resolveDescription,
  extractStepSentences,
  type GenerateDeps,
} from './generate.js';

function appConfig(aiEnabled: boolean): AppConfig {
  return {
    appId: 'demo',
    buildPath: 'build/Demo.app',
    deviceType: 'simulator',
    deviceId: 'iPhone 15',
    osVersion: '17.0',
    ai: { enabled: aiEnabled, healRetries: 3 },
  };
}

const fakeAgent: CodeAgent = { invoke: async () => null };

function makeDeps(overrides?: Partial<GenerateDeps>): { deps: GenerateDeps; lines: string[] } {
  const lines: string[] = [];
  const deps: GenerateDeps = {
    loadAppConfig: async () => appConfig(true),
    readFile: () => 'PAGE_SOURCE',
    readExistingSteps: () => ['I log in'],
    generate: async () => ({ ok: true, draftPaths: ['apps/demo/features/x.feature'] }),
    createAgent: () => fakeAgent,
    print: (line) => lines.push(line),
    ...overrides,
  };
  return { deps, lines };
}

const input = { appId: 'demo', description: 'log in with valid credentials', pageSourcePath: 'ps.xml' };

describe('runGenerate', () => {
  it('does not call AI and tells QC to author manually when AI is off for the app', async () => {
    const generate = vi.fn<GenerateDeps['generate']>();
    const { deps, lines } = makeDeps({ loadAppConfig: async () => appConfig(false), generate });

    const code = await runGenerate(input, deps);

    expect(code).toBe(0);
    expect(generate).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('author the test case manually');
  });

  it('calls generateTestCase with the existing steps and prints draft paths on success', async () => {
    const generate = vi.fn<GenerateDeps['generate']>(async () => ({
      ok: true,
      draftPaths: ['apps/demo/features/login.feature', 'apps/demo/steps/login.steps.ts'],
    }));
    const { deps, lines } = makeDeps({ readExistingSteps: () => ['I log in', 'I see the menu'], generate });

    const code = await runGenerate(input, deps);

    expect(code).toBe(0);
    expect(generate).toHaveBeenCalledOnce();
    const ctx: GenerateContext | undefined = generate.mock.calls[0]?.[1];
    expect(ctx?.existingSteps).toEqual(['I log in', 'I see the menu']);
    expect(ctx?.description).toBe(input.description);
    expect(ctx?.pageSource).toBe('PAGE_SOURCE');
    expect(lines.join('\n')).toContain('apps/demo/features/login.feature');
  });

  it('builds the AI agent with cwd = apps/<app-id> so drafts land in the app directory', async () => {
    const createAgent = vi.fn<GenerateDeps['createAgent']>(() => fakeAgent);
    const { deps } = makeDeps({ createAgent });

    await runGenerate(input, deps);

    expect(createAgent).toHaveBeenCalledWith(join('apps', 'demo'));
  });

  it('prints the reason and returns non-zero when generation reports failure', async () => {
    const { deps, lines } = makeDeps({
      generate: async (): Promise<GenerateOutcome> => ({ ok: false, reason: 'AI CLI unavailable' }),
    });

    const code = await runGenerate(input, deps);

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('AI CLI unavailable');
  });

  it('returns non-zero and prints the error when the app config cannot be loaded', async () => {
    const generate = vi.fn<GenerateDeps['generate']>();
    const { deps, lines } = makeDeps({
      loadAppConfig: async () => {
        throw new Error('no such app: demo');
      },
      generate,
    });

    const code = await runGenerate(input, deps);

    expect(code).toBe(1);
    expect(generate).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('no such app: demo');
  });

  it('returns non-zero without calling AI when the page source file cannot be read', async () => {
    const generate = vi.fn<GenerateDeps['generate']>();
    const { deps, lines } = makeDeps({
      readFile: () => {
        throw new Error('ENOENT: ps.xml');
      },
      generate,
    });

    const code = await runGenerate(input, deps);

    expect(code).toBe(1);
    expect(generate).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('ENOENT: ps.xml');
  });
});

describe('resolveDescription', () => {
  it('reads the file when --description-file is given', () => {
    expect(resolveDescription({ descriptionFile: 'd.txt' }, () => 'from file')).toBe('from file');
  });

  it('uses the inline text when --description is given', () => {
    expect(resolveDescription({ description: 'inline' }, () => 'unused')).toBe('inline');
  });

  it('returns null when neither is given', () => {
    expect(resolveDescription({}, () => 'unused')).toBeNull();
  });
});

describe('extractStepSentences', () => {
  it('extracts Given/When/Then sentences from a step-definition file', () => {
    const content = [
      "import { Given, When, Then } from '@cucumber/cucumber';",
      "Given('the cart is empty', async () => {});",
      "When('I add a product to the cart', async () => {});",
      'Then("the cart shows {int} items", async (count) => {});',
    ].join('\n');

    expect(extractStepSentences(content)).toEqual([
      'the cart is empty',
      'I add a product to the cart',
      'the cart shows {int} items',
    ]);
  });

  it('returns an empty array when there are no step definitions', () => {
    expect(extractStepSentences('export const x = 1;')).toEqual([]);
  });
});
