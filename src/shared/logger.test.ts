import { describe, it, expect } from 'vitest';
import { registerSecretPaths, redactObject } from './logger.js';

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
});
