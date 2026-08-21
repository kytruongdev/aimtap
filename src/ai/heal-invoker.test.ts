import { describe, it, expect, vi } from 'vitest';
import type { CodeAgent } from './code-agent.js';
import { healLocator } from './heal-invoker.js';
import { buildHealPrompt } from './prompts/heal.js';

const ctx = {
  expectedLocator: 'accessibility-id(Login-button)',
  screenName: 'LoginScreen',
  pageSource: '<XCUIElementTypeButton name="Sign In" />',
};

function agentReturning(value: string | null): CodeAgent {
  return { invoke: vi.fn(async () => value) };
}

describe('buildHealPrompt', () => {
  it('includes the broken locator, screen and page source and asks for one locator', () => {
    const prompt = buildHealPrompt(ctx);

    expect(prompt).toContain('accessibility-id(Login-button)');
    expect(prompt).toContain('LoginScreen');
    expect(prompt).toContain('<XCUIElementTypeButton name="Sign In" />');
    expect(prompt).toContain('"strategy"');
    expect(prompt).toContain('"selector"');
    // the four valid strategies are named
    expect(prompt).toContain('accessibility-id, id, predicate, class-chain');
    expect(prompt).toContain('Do not modify any files.');
  });
});

describe('healLocator', () => {
  it('builds a Locator from a valid result (selector → value)', async () => {
    const agent = agentReturning('{"strategy":"accessibility-id","selector":"Sign In"}');

    await expect(healLocator(agent, ctx)).resolves.toEqual({
      strategy: 'accessibility-id',
      value: 'Sign In',
    });
  });

  it('passes the built prompt to the agent in heal mode', async () => {
    const agent = agentReturning('{"strategy":"id","selector":"login"}');

    await healLocator(agent, ctx);

    expect(agent.invoke).toHaveBeenCalledWith('heal', buildHealPrompt(ctx));
  });

  it('returns null when the agent is unavailable', async () => {
    await expect(healLocator(agentReturning(null), ctx)).resolves.toBeNull();
  });

  it('returns null on malformed (non-JSON) output', async () => {
    await expect(healLocator(agentReturning('not json'), ctx)).resolves.toBeNull();
  });

  it('returns null when the strategy is not a known strategy', async () => {
    const agent = agentReturning('{"strategy":"xpath","selector":"//x"}');

    await expect(healLocator(agent, ctx)).resolves.toBeNull();
  });

  it('returns null when the selector is missing or empty', async () => {
    await expect(
      healLocator(agentReturning('{"strategy":"id","selector":""}'), ctx),
    ).resolves.toBeNull();
    await expect(
      healLocator(agentReturning('{"strategy":"id"}'), ctx),
    ).resolves.toBeNull();
  });
});
