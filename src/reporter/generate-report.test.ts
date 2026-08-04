import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, createRunRepository, SCHEMA_VERSION, type RunStart } from '../store/index.js';
import { findAppForRun } from './generate-report.js';

function tmpOut(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-report-'));
}

function seedRun(outputDir: string, appId: string, runId: string): void {
  const db = openDatabase(appId, outputDir);
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

describe('findAppForRun', () => {
  it('finds the app whose store holds the run', () => {
    const out = tmpOut();
    seedRun(out, 'demo', 'run-1');
    seedRun(out, 'other', 'run-2');

    expect(findAppForRun('run-1', out)).toBe('demo');
    expect(findAppForRun('run-2', out)).toBe('other');
  });

  it('returns null when no store holds the run', () => {
    const out = tmpOut();
    seedRun(out, 'demo', 'run-1');

    expect(findAppForRun('missing', out)).toBeNull();
  });

  it('returns null when the output directory does not exist', () => {
    expect(findAppForRun('run-1', path.join(os.tmpdir(), 'aimtap-none-xyz'))).toBeNull();
  });
});
