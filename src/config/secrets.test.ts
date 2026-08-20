import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isPlatformFailure, redactObject } from '../shared/index.js';
import {
  loadApiKey,
  loadCliToken,
  upsertEnvVar,
  loadTestData,
  verifyTestDataComplete,
} from './secrets.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-config-'));
}

function writeApp(dir: string, appId: string, file: string, data: unknown): void {
  const appDir = path.join(dir, appId);
  fs.mkdirSync(appDir, { recursive: true });
  fs.writeFileSync(path.join(appDir, file), JSON.stringify(data), 'utf8');
}

const example = {
  secrets: { accounts: { standard: { username: 'user@example.com', password: 'REPLACE_ME' } } },
  env: { baseUrl: 'https://REPLACE_ME' },
};

function failureFrom(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw');
}

describe('loadApiKey', () => {
  it('reads the key from the root .env.local and returns it', () => {
    const root = tmpDir();
    fs.writeFileSync(path.join(root, '.env.local'), '# secrets\nANTHROPIC_API_KEY="sk-abc-123"\n');

    expect(loadApiKey({ rootDir: root })).toBe('sk-abc-123');
  });

  it('falls back to the ambient environment when no file value is set', () => {
    const root = tmpDir();

    expect(loadApiKey({ rootDir: root, env: { ANTHROPIC_API_KEY: 'sk-env' } })).toBe('sk-env');
  });

  it('returns null when the key is unset, so the platform runs without it', () => {
    const root = tmpDir();

    expect(loadApiKey({ rootDir: root, env: {} })).toBeNull();
  });

  it('registers the key with the log mask', () => {
    const root = tmpDir();
    loadApiKey({ rootDir: root, env: { ANTHROPIC_API_KEY: 'sk-secret' } });

    expect(redactObject({ ANTHROPIC_API_KEY: 'sk-secret' })).toEqual({
      ANTHROPIC_API_KEY: '[REDACTED]',
    });
  });
});

describe('loadCliToken', () => {
  it('reads the token from the root .env.local and prefers it over the ambient env', () => {
    const root = tmpDir();
    fs.writeFileSync(
      path.join(root, '.env.local'),
      '# ai\nCLAUDE_CODE_OAUTH_TOKEN="tok-from-file"\n',
    );

    expect(loadCliToken({ rootDir: root, env: { CLAUDE_CODE_OAUTH_TOKEN: 'tok-from-env' } })).toBe(
      'tok-from-file',
    );
  });

  it('falls back to the ambient environment when no file value is set', () => {
    const root = tmpDir();

    expect(loadCliToken({ rootDir: root, env: { CLAUDE_CODE_OAUTH_TOKEN: 'tok-env' } })).toBe(
      'tok-env',
    );
  });

  it('returns null when the token is unset or blank, so AI features stay off', () => {
    const root = tmpDir();

    expect(loadCliToken({ rootDir: root, env: {} })).toBeNull();
    expect(loadCliToken({ rootDir: root, env: { CLAUDE_CODE_OAUTH_TOKEN: '   ' } })).toBeNull();
  });

  it('registers the token with the log mask', () => {
    const root = tmpDir();
    loadCliToken({ rootDir: root, env: { CLAUDE_CODE_OAUTH_TOKEN: 'tok-secret' } });

    expect(redactObject({ CLAUDE_CODE_OAUTH_TOKEN: 'tok-secret' })).toEqual({
      CLAUDE_CODE_OAUTH_TOKEN: '[REDACTED]',
    });
  });
});

describe('upsertEnvVar', () => {
  it('appends the key when the file does not exist yet', () => {
    const root = tmpDir();
    upsertEnvVar('CLAUDE_CODE_OAUTH_TOKEN', 'tok-1', { rootDir: root });

    const content = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
    expect(content).toBe('CLAUDE_CODE_OAUTH_TOKEN=tok-1\n');
  });

  it('updates an existing key without touching other keys or comments', () => {
    const root = tmpDir();
    fs.writeFileSync(
      path.join(root, '.env.local'),
      '# secrets\nANTHROPIC_API_KEY=sk-keep\nCLAUDE_CODE_OAUTH_TOKEN=old\n',
    );

    upsertEnvVar('CLAUDE_CODE_OAUTH_TOKEN', 'new', { rootDir: root });

    const content = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
    expect(content).toBe('# secrets\nANTHROPIC_API_KEY=sk-keep\nCLAUDE_CODE_OAUTH_TOKEN=new\n');
  });

  it('appends a new key while keeping existing ones', () => {
    const root = tmpDir();
    fs.writeFileSync(path.join(root, '.env.local'), 'ANTHROPIC_API_KEY=sk-keep\n');

    upsertEnvVar('CLAUDE_CODE_OAUTH_TOKEN', 'tok', { rootDir: root });

    const content = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
    expect(content).toBe('ANTHROPIC_API_KEY=sk-keep\nCLAUDE_CODE_OAUTH_TOKEN=tok\n');
  });
});

describe('loadTestData', () => {
  it('throws a PlatformFailure naming the file when the local data is missing', () => {
    const dir = tmpDir();
    const error = failureFrom(() => loadTestData('demo', dir));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('test-data.example.json');
  });

  it('rejects malformed JSON and names the file', () => {
    const dir = tmpDir();
    fs.mkdirSync(path.join(dir, 'demo'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'demo', 'test-data.local.json'), '{ not json', 'utf8');

    const error = failureFrom(() => loadTestData('demo', dir));
    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('not valid JSON');
  });

  it('loads valid data and masks the secret branch but not env', () => {
    const dir = tmpDir();
    writeApp(dir, 'demo', 'test-data.local.json', {
      secrets: { accounts: { standard: { username: 'real@user.com', password: 'hunter2' } } },
      env: { baseUrl: 'https://demo.test' },
    });

    const data = loadTestData('demo', dir);
    expect(data.env.baseUrl).toBe('https://demo.test');

    const masked = redactObject({ secrets: data.secrets, env: data.env });
    expect(masked).toEqual({
      secrets: { accounts: { standard: { username: '[REDACTED]', password: '[REDACTED]' } } },
      env: { baseUrl: 'https://demo.test' },
    });
  });
});

describe('verifyTestDataComplete', () => {
  beforeEach(() => {
    // nothing shared between cases; each builds its own temp app dir
  });

  it('reports every required field as missing when the local file is absent', () => {
    const dir = tmpDir();
    writeApp(dir, 'demo', 'test-data.example.json', example);

    const result = verifyTestDataComplete('demo', dir);
    expect(result).toEqual({
      ok: false,
      missing: ['secrets.accounts.standard.username', 'secrets.accounts.standard.password', 'env.baseUrl'],
    });
  });

  it('flags blank values and values left at the example placeholder', () => {
    const dir = tmpDir();
    writeApp(dir, 'demo', 'test-data.example.json', example);
    writeApp(dir, 'demo', 'test-data.local.json', {
      secrets: { accounts: { standard: { username: '  ', password: 'REPLACE_ME' } } },
      env: { baseUrl: 'https://demo.test' },
    });

    const result = verifyTestDataComplete('demo', dir);
    expect(result).toEqual({
      ok: false,
      missing: ['secrets.accounts.standard.username', 'secrets.accounts.standard.password'],
    });
  });

  it('returns ok when every required field has a real value', () => {
    const dir = tmpDir();
    writeApp(dir, 'demo', 'test-data.example.json', example);
    writeApp(dir, 'demo', 'test-data.local.json', {
      secrets: { accounts: { standard: { username: 'real@user.com', password: 'hunter2' } } },
      env: { baseUrl: 'https://demo.test' },
    });

    expect(verifyTestDataComplete('demo', dir)).toEqual({ ok: true });
  });

  it('throws when the example template is missing from the repository', () => {
    const dir = tmpDir();
    const error = failureFrom(() => verifyTestDataComplete('demo', dir));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('template');
  });
});
