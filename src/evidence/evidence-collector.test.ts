import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEvidenceCollector } from './evidence-collector.js';
import type { Screenshotter } from './screenshot-writer.js';
import { AppFailure } from '../shared/index.js';
import type { StepLog, TestCaseResult } from '../store/index.js';

const dirs: string[] = [];

function tempOutput(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aimtap-collector-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function fakeRepo() {
  const calls: { result: TestCaseResult; steps: StepLog[] }[] = [];
  return {
    saveTestCaseResult(result: TestCaseResult, steps: StepLog[]) {
      calls.push({ result, steps });
    },
    calls,
  };
}

function seqId(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

const okShooter: Screenshotter = {
  takeScreenshot: () => Promise.resolve(Buffer.from('fake-png').toString('base64')),
};

const info = {
  test_feature: 'Login',
  test_case: 'signs in with valid credentials',
  started_at: '2026-07-30T10:00:00.000Z',
  duration_ms: 1200,
};

describe('evidence collector', () => {
  it('records a passing test case with no screenshot and empty failure fields', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({ order: 1, text: 'the user opens the app', result: 'passed', duration_ms: 200 });
    collector.onStepEnd({ order: 2, text: 'the user signs in', result: 'passed', duration_ms: 900 });
    const result = await collector.onScenarioEnd(info);

    expect(result.status).toBe('passed');
    expect(result.screen).toBeNull();
    expect(result.failure_type).toBeNull();
    expect(result.error_message).toBeNull();
    expect(result.evidence_missing).toBe(0);
    expect(repo.calls[0]?.steps.every((s) => s.screenshot_path === null)).toBe(true);
  });

  it('records a failing test case with screen, classification and a screenshot on the failing step', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({ order: 1, text: 'the user signs in', result: 'passed', duration_ms: 500 });
    collector.setCurrentScreen('HomeScreen');
    collector.onStepEnd({
      order: 2,
      text: 'the home screen is shown',
      result: 'failed',
      duration_ms: 8000,
      error: new AppFailure('expected "Home" but got "Login"', undefined, 'assertion'),
    });
    const result = await collector.onScenarioEnd(info);

    expect(result.status).toBe('failed');
    expect(result.screen).toBe('HomeScreen');
    expect(result.failure_type).toBe('wrong_conclusion');
    expect(result.error_message).toBe('expected "Home" but got "Login"');
    expect(result.evidence_missing).toBe(0);

    const steps = repo.calls[0]?.steps ?? [];
    expect(steps[0]?.screenshot_path).toBeNull();
    expect(steps[1]?.screenshot_path).toBe(path.join('screenshots', 'run-1', 'fail-step-2-0.png'));
    expect(steps[1]?.error_message).toBe('expected "Home" but got "Login"');
  });

  it('classifies a non-assertion error as step_not_executed', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({
      order: 1,
      text: 'the profile button is tapped',
      result: 'failed',
      duration_ms: 30000,
      error: new AppFailure('element not found on HomeScreen'),
    });
    const result = await collector.onScenarioEnd(info);

    expect(result.failure_type).toBe('step_not_executed');
    expect(result.error_message).toBe('element not found on HomeScreen');
  });

  it('marks evidence_missing without changing the test case status when capture fails', async () => {
    const failingShooter: Screenshotter = {
      takeScreenshot: () => Promise.reject(new Error('session gone')),
    };
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: failingShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({
      order: 1,
      text: 'the home screen is shown',
      result: 'failed',
      duration_ms: 8000,
      error: new AppFailure('wrong text', undefined, 'assertion'),
    });
    const result = await collector.onScenarioEnd(info);

    expect(result.status).toBe('failed');
    expect(result.failure_type).toBe('wrong_conclusion');
    expect(result.evidence_missing).toBe(1);
    expect(repo.calls[0]?.steps[0]?.screenshot_path).toBeNull();
  });

  it('captures a screenshot for a passing step marked for capture (BR-003)', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({
      order: 1,
      text: 'the dashboard renders',
      result: 'passed',
      duration_ms: 400,
      capture: true,
    });
    const result = await collector.onScenarioEnd(info);

    expect(result.status).toBe('passed');
    expect(repo.calls[0]?.steps[0]?.screenshot_path).toBe(
      path.join('screenshots', 'run-1', 'mark-step-1-0.png'),
    );
  });

  it('pushes the result and its steps through the repository in one call, stamping ids', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.onStepEnd({ order: 1, text: 'step one', result: 'passed', duration_ms: 100 });
    const result = await collector.onScenarioEnd(info);

    expect(repo.calls).toHaveLength(1);
    expect(repo.calls[0]?.result).toBe(result);
    expect(result.id).toBe('id-1');
    expect(repo.calls[0]?.steps[0]?.id).toBe('id-2');
    expect(repo.calls[0]?.steps[0]?.test_case_result_id).toBe('id-1');
  });

  it('resets per-scenario state so a second test case is independent', async () => {
    const repo = fakeRepo();
    const collector = createEvidenceCollector({
      repository: repo,
      screenshotter: okShooter,
      appId: 'demo',
      runId: 'run-1',
      newId: seqId(),
      outputDir: tempOutput(),
    });

    collector.setCurrentScreen('HomeScreen');
    collector.onStepEnd({
      order: 1,
      text: 'a failing step',
      result: 'failed',
      duration_ms: 10,
      error: new AppFailure('boom', undefined, 'assertion'),
    });
    await collector.onScenarioEnd(info);

    collector.onStepEnd({ order: 1, text: 'a passing step', result: 'passed', duration_ms: 10 });
    const second = await collector.onScenarioEnd(info);

    expect(second.status).toBe('passed');
    expect(second.screen).toBeNull();
    expect(second.failure_type).toBeNull();
    expect(second.error_message).toBeNull();
    expect(repo.calls[1]?.steps).toHaveLength(1);
  });
});
