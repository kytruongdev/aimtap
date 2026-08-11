import { describe, it, expect, vi } from 'vitest';
import { PlatformFailure } from '../../shared/index.js';
import type { AppConfig } from '../../registry/index.js';
import type { DeviceContext, DeviceDriver, EnvironmentReport } from '../../device/index.js';
import type { TestDataCompleteness } from '../../config/index.js';
import type { RunOutcome } from '../../runner/index.js';
import { executeRun, prepareRun, resolveScope, type RunDeps, type RunSteps } from './run.js';

const appConfig: AppConfig = {
  appId: 'demo',
  buildPath: '/builds/demo.app',
  deviceType: 'simulator',
  deviceId: 'iPhone 15',
  osVersion: '17.5',
};
const deviceContext: DeviceContext = {
  device_id: 'iPhone 15',
  device_type: 'simulator',
  os_version: '17.5',
  app_version: '1.2.0',
};
const envOk: EnvironmentReport = { ok: true, items: [{ name: 'node', status: 'ok', reason: null }] };
const dataOk: TestDataCompleteness = { ok: true };
const driver = {} as DeviceDriver;

function steps(overrides: Partial<RunSteps> = {}): RunSteps {
  return {
    loadAppConfig: () => Promise.resolve(appConfig),
    checkEnvironment: () => envOk,
    verifyTestDataComplete: () => dataOk,
    createDriver: () => driver,
    ensureReadyBeforeRun: () => deviceContext,
    installBuild: () => undefined,
    newRunId: () => 'run-1',
    ...overrides,
  };
}

describe('prepareRun', () => {
  it('returns the context when every precondition passes', async () => {
    const result = await prepareRun('demo', steps());
    expect(result).toEqual({ ok: true, appConfig, deviceContext, runId: 'run-1' });
  });

  it('stops when the app is not declared', async () => {
    const result = await prepareRun('demo', steps({
      loadAppConfig: () => Promise.reject(new PlatformFailure('App "demo" is not declared')),
    }));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain('not declared');
  });

  it('stops and lists the failing environment items', async () => {
    const result = await prepareRun('demo', steps({
      checkEnvironment: () => ({ ok: false, items: [{ name: 'appium', status: 'failed', reason: 'not found' }] }),
    }));
    expect(result).toMatchObject({ ok: false, reason: 'Environment is not ready' });
    if (!result.ok) expect(result.detail).toEqual(['appium: not found']);
  });

  it('stops and lists the missing test-data fields', async () => {
    const result = await prepareRun('demo', steps({
      verifyTestDataComplete: () => ({ ok: false, missing: ['secrets.accounts.standard.password'] }),
    }));
    expect(result).toMatchObject({ ok: false, reason: 'Test data is incomplete' });
    if (!result.ok) expect(result.detail).toContain('secrets.accounts.standard.password');
  });

  it('stops when the device is not ready', async () => {
    const result = await prepareRun('demo', steps({
      ensureReadyBeforeRun: () => {
        throw new PlatformFailure('Device sim-1 is not available');
      },
    }));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain('not available');
  });
});

describe('resolveScope', () => {
  it('is a full suite when nothing is selected', () => {
    expect(resolveScope({})).toEqual({
      kind: 'full_suite',
      criteria: null,
      specs: [],
      tagExpression: null,
      names: [],
    });
  });

  it('reflects feature, tag and name selection into scope_kind and scope_criteria', () => {
    const scope = resolveScope({ feature: 'login.feature', tag: '@smoke', name: ['valid'] });
    expect(scope.kind).toBe('subset');
    expect(scope.specs).toEqual(['login.feature']);
    expect(scope.tagExpression).toBe('@smoke');
    expect(scope.names).toEqual(['valid']);
    expect(JSON.parse(scope.criteria ?? '{}')).toEqual({
      feature: 'login.feature',
      tag: '@smoke',
      names: ['valid'],
    });
  });
});

describe('executeRun', () => {
  function deps(overrides: Partial<RunDeps> = {}): { deps: RunDeps; lines: string[] } {
    const lines: string[] = [];
    return {
      lines,
      deps: {
        steps: steps(),
        launch: vi.fn().mockResolvedValue({ runId: 'run-1', exitCode: 0 } satisfies RunOutcome),
        report: vi.fn().mockResolvedValue(undefined),
        summarize: vi.fn().mockReturnValue({
          app_id: 'demo',
          run_id: 'run-1',
          features: [],
          total: 0,
          passed: 0,
          failed: 0,
          passed_healed: 0,
        }),
        outputDir: '/out',
        print: (line) => lines.push(line),
        ...overrides,
      },
    };
  }

  it('prints a per-feature pass/fail summary after the run', async () => {
    const summarize = vi.fn().mockReturnValue({
      app_id: 'demo',
      run_id: 'run-1',
      features: [
        {
          test_feature: 'Cart',
          test_cases: [
            { test_case: 'Add a product to the cart', status: 'passed' },
            { test_case: 'Cart count wrongly two', status: 'failed' },
          ],
          passed: 1,
          failed: 1,
          passed_healed: 0,
        },
      ],
      total: 2,
      passed: 1,
      failed: 1,
      passed_healed: 0,
    });
    const { deps: d, lines } = deps({ summarize });

    await executeRun('demo', {}, d);

    const out = lines.join('\n');
    expect(summarize).toHaveBeenCalledOnce();
    expect(out).toContain('Feature: Cart');
    expect(out).toContain('Add a product to the cart');
    expect(out).toContain('1 passed, 1 failed');
  });

  it('does not launch or report when a precondition fails, and exits non-zero', async () => {
    const launch = vi.fn();
    const report = vi.fn();
    const { deps: d, lines } = deps({
      steps: steps({ verifyTestDataComplete: () => ({ ok: false, missing: ['env.baseUrl'] }) }),
      launch,
      report,
    });

    const code = await executeRun('demo', {}, d);

    expect(code).toBe(1);
    expect(launch).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('Test data is incomplete');
    expect(lines.join('\n')).toContain('env.baseUrl');
    expect(lines.join('\n')).toContain('Run not started.');
  });

  it('launches then generates the report, returning the launcher exit code', async () => {
    const launch = vi.fn().mockResolvedValue({ runId: 'run-1', exitCode: 2 } satisfies RunOutcome);
    const report = vi.fn().mockResolvedValue(undefined);
    const { deps: d } = deps({ launch, report });

    const code = await executeRun('demo', { tag: '@smoke' }, d);

    expect(code).toBe(2);
    expect(launch).toHaveBeenCalledOnce();
    const launchArg = launch.mock.calls[0]?.[0];
    expect(launchArg).toMatchObject({ runId: 'run-1', outputDir: '/out' });
    expect(launchArg?.scope.kind).toBe('subset');
    expect(report).toHaveBeenCalledWith('run-1', 'demo', '/out');
  });
});
