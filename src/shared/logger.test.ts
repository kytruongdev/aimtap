import { describe, it, expect } from 'vitest';
import { registerSecretPaths, redactObject } from './logger.js';
import { AppFailure } from './errors.js';

describe('logger redaction', () => {
  it('censors values at registered dotted paths with a wildcard segment', () => {
    registerSecretPaths(['secrets.accounts.*.password']);

    const output = redactObject({
      secrets: {
        accounts: {
          standard: { username: 'qa-user', password: 'p@ss-secret' },
          locked: { username: 'locked-user', password: 'another-secret' },
        },
      },
      env: { baseUrl: 'https://example.test' },
    });

    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain('p@ss-secret');
    expect(serialized).not.toContain('another-secret');
    // Non-secret branches stay intact.
    expect(serialized).toContain('https://example.test');
    expect(serialized).toContain('qa-user');
  });

  it('does not mutate the input object', () => {
    registerSecretPaths(['token']);
    const input = { token: 'raw-token' };
    const output = redactObject(input);
    expect(input.token).toBe('raw-token');
    expect(output['token']).toBe('[REDACTED]');
  });

  it('redacts objects that contain non-cloneable values without throwing', () => {
    registerSecretPaths(['secrets.token']);
    const failure = new AppFailure('login failed');
    const handler = (): number => 42;

    const output = redactObject({
      err: failure,
      handler,
      secrets: { token: 'super-secret' },
    });

    expect(JSON.stringify(output)).not.toContain('super-secret');
    // Non-cloneable values are kept by reference, not cloned, and do not crash redaction.
    expect(output['err']).toBe(failure);
    expect(output['handler']).toBe(handler);
  });
});
