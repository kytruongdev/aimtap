import { describe, it, expect } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import { parseEnv } from './env.schema.js';

function failureFrom(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw');
}

describe('parseEnv', () => {
  it('applies defaults on a bare environment', () => {
    const env = parseEnv({});

    expect(env.LOG_LEVEL).toBe('info');
    expect(env.AIMTAP_AI_ENABLED).toBe(false);
    expect(env.AIMTAP_OUTPUT_DIR).toBeUndefined();
    expect(env.AIMTAP_WAIT_TIMEOUT_MS).toBeUndefined();
  });

  it('turns AIMTAP_AI_ENABLED into a boolean', () => {
    expect(parseEnv({ AIMTAP_AI_ENABLED: 'true' } as NodeJS.ProcessEnv).AIMTAP_AI_ENABLED).toBe(true);
    expect(parseEnv({ AIMTAP_AI_ENABLED: 'false' } as NodeJS.ProcessEnv).AIMTAP_AI_ENABLED).toBe(
      false,
    );
  });

  it('coerces the wait overrides to numbers', () => {
    const env = parseEnv({
      AIMTAP_WAIT_TIMEOUT_MS: '25000',
      AIMTAP_WAIT_RETRIES: '0',
    } as NodeJS.ProcessEnv);

    expect(env.AIMTAP_WAIT_TIMEOUT_MS).toBe(25000);
    expect(env.AIMTAP_WAIT_RETRIES).toBe(0);
  });

  it('rejects an unknown log level and names the variable', () => {
    const error = failureFrom(() => parseEnv({ LOG_LEVEL: 'verbose' } as NodeJS.ProcessEnv));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('LOG_LEVEL');
  });

  it('rejects a non-numeric wait override and names the variable', () => {
    const error = failureFrom(() =>
      parseEnv({ AIMTAP_WAIT_TIMEOUT_MS: 'soon' } as NodeJS.ProcessEnv),
    );

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('AIMTAP_WAIT_TIMEOUT_MS');
  });
});
