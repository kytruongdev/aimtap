import { describe, it, expect, vi } from 'vitest';
import type { CodeAgent } from './code-agent.js';
import { generateTestCase } from './generate-invoker.js';
import { buildGeneratePrompt, AI_GENERATED_TAG } from './prompts/generate.js';

const ctx = {
  description: 'The user adds a product to the cart',
  pageSource: '<XCUIElementTypeButton name="Add to cart" />',
  existingSteps: ['I am signed in', 'I open the catalog'],
};

function agentReturning(value: string | null): CodeAgent {
  return { invoke: vi.fn(async () => value) };
}

describe('buildGeneratePrompt', () => {
  it('includes the description, page source, existing steps and the reuse + tag instructions', () => {
    const prompt = buildGeneratePrompt(ctx);

    expect(prompt).toContain('The user adds a product to the cart');
    expect(prompt).toContain('<XCUIElementTypeButton name="Add to cart" />');
    expect(prompt).toContain('- I am signed in');
    expect(prompt).toContain('- I open the catalog');
    expect(prompt).toContain('Reuse the existing step definitions');
    expect(prompt).toContain(AI_GENERATED_TAG);
    expect(prompt).toContain('"files"');
  });

  it('handles an empty existing-steps list', () => {
    const prompt = buildGeneratePrompt({ ...ctx, existingSteps: [] });
    expect(prompt).toContain('(none yet)');
  });
});

describe('generateTestCase', () => {
  it('reports the draft files on a valid result', async () => {
    const agent = agentReturning('{"files":["apps/demo/features/cart.feature","apps/demo/screens/cart.screen.ts"]}');

    const outcome = await generateTestCase(agent, ctx);

    expect(outcome).toEqual({
      ok: true,
      draftPaths: ['apps/demo/features/cart.feature', 'apps/demo/screens/cart.screen.ts'],
    });
  });

  it('passes the built prompt to the agent in generate mode', async () => {
    const agent = agentReturning('{"files":["a"]}');

    await generateTestCase(agent, ctx);

    expect(agent.invoke).toHaveBeenCalledWith('generate', buildGeneratePrompt(ctx));
  });

  it('returns not-ok when the agent is unavailable', async () => {
    const outcome = await generateTestCase(agentReturning(null), ctx);
    expect(outcome.ok).toBe(false);
  });

  it('returns not-ok on malformed output', async () => {
    const outcome = await generateTestCase(agentReturning('not json'), ctx);
    expect(outcome.ok).toBe(false);
  });

  it('returns not-ok when no draft files are listed', async () => {
    await expect(generateTestCase(agentReturning('{"files":[]}'), ctx)).resolves.toMatchObject({
      ok: false,
    });
    await expect(generateTestCase(agentReturning('{"other":true}'), ctx)).resolves.toMatchObject({
      ok: false,
    });
  });
});
