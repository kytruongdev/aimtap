import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PlatformFailure } from '../shared/index.js';
import { openDatabase, createRunRepository, SCHEMA_VERSION, type RunStart } from '../store/index.js';
import { generateReport, summarizeRun } from './generate-report.js';

function tmpDirs(): { dataDir: string; outputDir: string } {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-report-'));
  return { dataDir: path.join(base, 'data'), outputDir: path.join(base, 'output') };
}

function seedRun(dataDir: string, appId: string, runId: string): void {
  const db = openDatabase(dataDir);
  const run: RunStart = {
    run_id: runId,
    app_id: appId,
    app_version: '1.0.0',
    device_id: 'sim-1',
    device_type: 'simulator',
    os_version: '17.5',
    started_at: '2026-08-04T10:00:00.000Z',
    scope_kind: 'full_suite',
    scope_criteria: null,
    schema_version: SCHEMA_VERSION,
  };
  createRunRepository(db).saveRunStart(run);
  db.close();
}

describe('generateReport (shared store)', () => {
  it('writes each run under output/<app>/reports/<run>.html, resolving the app from the run row', async () => {
    const { dataDir, outputDir } = tmpDirs();
    // Two apps, one shared database.
    seedRun(dataDir, 'demo', 'run-1');
    seedRun(dataDir, 'other', 'run-2');

    const file1 = await generateReport('run-1', outputDir, dataDir);
    const file2 = await generateReport('run-2', outputDir, dataDir);

    expect(file1).toBe(path.join(outputDir, 'demo', 'reports', 'run-1.html'));
    expect(file2).toBe(path.join(outputDir, 'other', 'reports', 'run-2.html'));
    expect(fs.existsSync(file1)).toBe(true);
    expect(fs.readFileSync(file1, 'utf8')).toContain('run-1');
  });

  it('throws when the run does not exist', async () => {
    const { dataDir, outputDir } = tmpDirs();
    seedRun(dataDir, 'demo', 'run-1');

    await expect(generateReport('missing', outputDir, dataDir)).rejects.toBeInstanceOf(PlatformFailure);
  });
});

describe('summarizeRun (shared store)', () => {
  it('summarizes a run read from the shared store', () => {
    const { dataDir } = tmpDirs();
    seedRun(dataDir, 'demo', 'run-1');

    const summary = summarizeRun('run-1', dataDir);

    expect(summary.app_id).toBe('demo');
    expect(summary.run_id).toBe('run-1');
  });
});
