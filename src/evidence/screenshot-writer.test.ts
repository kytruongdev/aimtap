import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captureScreenshot, type Screenshotter } from './screenshot-writer.js';

const dirs: string[] = [];

function tempOutput(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-shot-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const okShooter: Screenshotter = {
  takeScreenshot: () => Promise.resolve(Buffer.from('fake-png').toString('base64')),
};

describe('captureScreenshot', () => {
  it('writes the file and returns its relative path', async () => {
    const outputDir = tempOutput();
    const result = await captureScreenshot(okShooter, {
      appId: 'demo',
      runId: 'run-1',
      name: 'login step 2',
      outputDir,
    });

    expect(result.missing).toBe(false);
    expect(result.path).toBe(path.join('screenshots', 'run-1', 'login_step_2.png'));
    expect(
      fs.existsSync(path.join(outputDir, 'demo', 'screenshots', 'run-1', 'login_step_2.png')),
    ).toBe(true);
  });

  it('reports missing evidence without throwing when capture fails', async () => {
    const failing: Screenshotter = {
      takeScreenshot: () => Promise.reject(new Error('session gone')),
    };

    const result = await captureScreenshot(failing, {
      appId: 'demo',
      runId: 'run-1',
      name: 'login step 2',
      outputDir: tempOutput(),
    });

    expect(result).toEqual({ path: null, missing: true });
  });
});
