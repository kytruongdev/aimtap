import { randomUUID } from 'node:crypto';
import { Command } from 'commander';
import type { DeviceType } from '../../shared/index.js';
import { loadAppConfig, type AppConfig } from '../../registry/index.js';
import { loadPlatformConfig, verifyTestDataComplete, type TestDataCompleteness } from '../../config/index.js';
import {
  checkEnvironment,
  createDriver,
  createSystemProbes,
  ensureReadyBeforeRun,
  installBuild,
  type DeviceContext,
  type DeviceDriver,
  type EnvironmentReport,
} from '../../device/index.js';
import { launchRun, type RunOutcome, type RunScope } from '../../runner/index.js';
import { generateReport, summarizeRun, formatRunSummary, type RunSummary } from '../../reporter/index.js';

// TICKET-021 (ADR-018, sequence-diagrams §1): `aimtap run <app-id>`. The precondition chain runs in
// the CLI process; any failing item stops the run before it opens — no record, no report — naming the
// reason per item (UC-06 E1, BR-015). On success the CLI generates the run-id, launches the WDIO
// testrunner via launchRun (which asserts AIMTAP_* before wdio starts), then generates the report
// from the stored data (UC-06 step 7). The orchestration is unit-tested through injected steps; the
// launcher and report render are verified end to end when a real run executes (conventions §3.1).

export interface RunSteps {
  loadAppConfig(appId: string): Promise<AppConfig>;
  checkEnvironment(): EnvironmentReport;
  verifyTestDataComplete(appId: string): TestDataCompleteness;
  createDriver(deviceType: DeviceType): DeviceDriver;
  ensureReadyBeforeRun(appConfig: AppConfig, driver: DeviceDriver): DeviceContext;
  installBuild(appConfig: AppConfig, driver: DeviceDriver): void;
  newRunId(): string;
}

export type RunPreparation =
  | { ok: true; appConfig: AppConfig; deviceContext: DeviceContext; runId: string }
  | { ok: false; reason: string; detail: string[] };

function rejectionFrom(error: unknown): { ok: false; reason: string; detail: string[] } {
  const reason = error instanceof Error ? error.message : String(error);
  return { ok: false, reason, detail: [] };
}

/** Run the precondition chain in order; stop at the first failing item without opening a run. */
export async function prepareRun(appId: string, steps: RunSteps): Promise<RunPreparation> {
  let appConfig: AppConfig;
  try {
    appConfig = await steps.loadAppConfig(appId);
  } catch (error) {
    return rejectionFrom(error);
  }

  const environment = steps.checkEnvironment();
  if (!environment.ok) {
    return {
      ok: false,
      reason: 'Environment is not ready',
      detail: environment.items
        .filter((item) => item.status === 'failed')
        .map((item) => `${item.name}: ${item.reason ?? 'failed'}`),
    };
  }

  const data = steps.verifyTestDataComplete(appId);
  if (!data.ok) {
    return { ok: false, reason: 'Test data is incomplete', detail: data.missing };
  }

  const driver = steps.createDriver(appConfig.deviceType);
  let deviceContext: DeviceContext;
  try {
    deviceContext = steps.ensureReadyBeforeRun(appConfig, driver);
    steps.installBuild(appConfig, driver);
  } catch (error) {
    return rejectionFrom(error);
  }

  return { ok: true, appConfig, deviceContext, runId: steps.newRunId() };
}

/** Translate the CLI selection flags to a run scope (US-12). No selection means the full suite. */
export function resolveScope(sel: { feature?: string; tag?: string; name?: string[] }): RunScope {
  const specs: string[] = [];
  const names = sel.name ?? [];
  let tagExpression: string | null = null;
  const criteria: Record<string, unknown> = {};

  if (sel.feature !== undefined) {
    specs.push(sel.feature);
    criteria.feature = sel.feature;
  }
  if (sel.tag !== undefined) {
    tagExpression = sel.tag;
    criteria.tag = sel.tag;
  }
  if (names.length > 0) criteria.names = names;

  const subset = Object.keys(criteria).length > 0;
  return {
    kind: subset ? 'subset' : 'full_suite',
    criteria: subset ? JSON.stringify(criteria) : null,
    specs,
    tagExpression,
    names,
  };
}

export interface RunDeps {
  steps: RunSteps;
  launch: (opts: Parameters<typeof launchRun>[0]) => Promise<RunOutcome>;
  report: (runId: string, appId: string, outputDir: string) => Promise<void>;
  summarize: (runId: string, appId: string, outputDir: string) => RunSummary;
  outputDir: string;
  print: (line: string) => void;
}

export async function executeRun(
  appId: string,
  sel: { feature?: string; tag?: string; name?: string[] },
  deps: RunDeps,
): Promise<number> {
  const prepared = await prepareRun(appId, deps.steps);
  if (!prepared.ok) {
    deps.print(prepared.reason);
    for (const item of prepared.detail) deps.print(`  - ${item}`);
    deps.print('Run not started.');
    return 1;
  }

  const scope = resolveScope(sel);
  deps.print(`Starting run ${prepared.runId} for "${appId}" (${scope.kind})`);

  const outcome = await deps.launch({
    runId: prepared.runId,
    target: prepared.appConfig,
    deviceContext: prepared.deviceContext,
    scope,
    outputDir: deps.outputDir,
  });

  // Regenerate the report from the stored data, whether the run completed or stopped early (ADR-006).
  await deps.report(prepared.runId, appId, deps.outputDir);
  deps.print(`Report: ${deps.outputDir}/${appId}/reports/${prepared.runId}.html`);

  // Per-feature pass/fail summary from stored results; a convenience that never changes the outcome.
  try {
    for (const line of formatRunSummary(deps.summarize(prepared.runId, appId, deps.outputDir))) {
      deps.print(line);
    }
  } catch {
    // ignore: the report and exit code are the source of truth
  }

  return outcome.exitCode;
}

function realSteps(): RunSteps {
  return {
    loadAppConfig,
    checkEnvironment: () => checkEnvironment(createSystemProbes()),
    verifyTestDataComplete,
    createDriver,
    ensureReadyBeforeRun,
    installBuild,
    newRunId: () => randomUUID(),
  };
}

function withDefaults(deps?: Partial<RunDeps>): RunDeps {
  return {
    steps: deps?.steps ?? realSteps(),
    launch: deps?.launch ?? launchRun,
    report:
      deps?.report ??
      (async (runId, _appId, outputDir) => {
        await generateReport(runId, outputDir);
      }),
    summarize: deps?.summarize ?? ((runId) => summarizeRun(runId)),
    outputDir: deps?.outputDir ?? loadPlatformConfig().outputDir,
    print: deps?.print ?? ((line) => process.stdout.write(`${line}\n`)),
  };
}

export function runCommand(deps?: Partial<RunDeps>): Command {
  return new Command('run')
    .argument('<app-id>', 'the app to run (apps/<app-id>)')
    .option('--feature <glob>', 'restrict to a test feature (.feature spec glob)')
    .option('--tag <expr>', 'restrict by Cucumber tag expression, e.g. "@smoke"')
    .option('--name <text...>', 'restrict by test-case name')
    .action(async (appId: string, opts: { feature?: string; tag?: string; name?: string[] }) => {
      process.exitCode = await executeRun(appId, opts, withDefaults(deps));
    });
}
