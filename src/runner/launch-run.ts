import path from 'node:path';
import type { AppConfig } from '../registry/index.js';
import type { DeviceContext } from '../device/index.js';
import { assertCapabilityEnv } from './cucumber-hooks.js';
import type { CapabilityKind } from './wdio-service.js';

// TICKET-021 (ADR-018): the CLI is the WDIO launcher process. launchRun wraps `@wdio/cli` Launcher so
// the WDIO details stay inside the Test Runner module. It generates nothing: the CLI passes the
// run-id it already created (injected to the worker via AIMTAP_RUN_ID, ADR-018), builds the per-run
// AIMTAP_* capability env from the AppConfig + validated DeviceContext, runs the authoritative
// presence guard before wdio starts (ADR-009), translates the scope to Cucumber spec/tag filters,
// and returns the run-id and exit code. The pure helpers are unit-tested; the Launcher call itself is
// verified when a real run executes (conventions §3.1).

export type ScopeKind = 'full_suite' | 'subset';

export interface RunScope {
  kind: ScopeKind;
  /** JSON text of the subset criteria; null for a full-suite run (FR-RUN-02). */
  criteria: string | null;
  /** Cucumber spec globs to restrict the run; empty means the whole suite. */
  specs: string[];
  /** Cucumber tag expression, or null. */
  tagExpression: string | null;
  /** Cucumber scenario-name filters (matched as regex by Cucumber); empty means no name filter. */
  names: string[];
}

export interface RunOutcome {
  runId: string;
  exitCode: number;
}

export interface LauncherLike {
  run(): Promise<number | undefined>;
}

export interface LaunchRunOptions {
  runId: string;
  appConfig: AppConfig;
  deviceContext: DeviceContext;
  scope: RunScope;
  outputDir: string;
  env?: NodeJS.ProcessEnv;
  configDir?: string;
  /** Seam: builds the WDIO launcher. Defaults to `@wdio/cli` Launcher (loaded lazily). */
  makeLauncher?: (configPath: string, args: Record<string, unknown>) => LauncherLike | Promise<LauncherLike>;
}

export function capabilityKindOf(deviceType: AppConfig['deviceType']): CapabilityKind {
  return deviceType === 'real' ? 'device' : 'sim';
}

function defaultConfigDir(): string {
  return path.join(process.cwd(), 'config');
}

export function wdioConfigPath(
  deviceType: AppConfig['deviceType'],
  configDir: string = defaultConfigDir(),
): string {
  const file = deviceType === 'real' ? 'wdio.ios.device.conf.ts' : 'wdio.ios.sim.conf.ts';
  return path.join(configDir, file);
}

/** Per-run capability env the worker reads (US-3.3 keys) plus run-id and output dir (ADR-018). */
export function buildRunEnv(
  runId: string,
  appConfig: AppConfig,
  deviceContext: DeviceContext,
  outputDir: string,
  base: NodeJS.ProcessEnv = {},
): Record<string, string> {
  const env: Record<string, string> = {
    AIMTAP_RUN_ID: runId,
    AIMTAP_APP_ID: appConfig.appId,
    AIMTAP_OUTPUT_DIR: outputDir,
    AIMTAP_DEVICE_NAME: appConfig.deviceId,
    AIMTAP_PLATFORM_VERSION: deviceContext.os_version,
    AIMTAP_APP_PATH: appConfig.buildPath,
  };
  if (appConfig.deviceType === 'real') {
    env.AIMTAP_UDID = appConfig.deviceId;
    // The signing identity is a secret from the ambient environment; the guard below fails the run
    // early with a readable message when it is missing.
    const org = base.AIMTAP_XCODE_ORG_ID;
    if (org !== undefined && org.trim() !== '') env.AIMTAP_XCODE_ORG_ID = org;
  }
  return env;
}

/** Translate the run scope to WDIO Launcher args (spec/tag filters). */
export function scopeToLauncherArgs(scope: RunScope): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  if (scope.specs.length > 0) args.spec = scope.specs;
  const cucumberOpts: Record<string, unknown> = {};
  if (scope.tagExpression !== null) cucumberOpts.tagExpression = scope.tagExpression;
  if (scope.names.length > 0) cucumberOpts.name = scope.names;
  if (Object.keys(cucumberOpts).length > 0) args.cucumberOpts = cucumberOpts;
  return args;
}

async function defaultLauncher(configPath: string, args: Record<string, unknown>): Promise<LauncherLike> {
  const { Launcher } = await import('@wdio/cli');
  return new Launcher(configPath, args) as unknown as LauncherLike;
}

export async function launchRun(opts: LaunchRunOptions): Promise<RunOutcome> {
  const ambient = opts.env ?? process.env;
  const runEnv = buildRunEnv(opts.runId, opts.appConfig, opts.deviceContext, opts.outputDir, ambient);

  // Authoritative AIMTAP_* presence guard, in the CLI/launcher process before wdio starts
  // (ADR-009, ADR-018) — the primary check the US-3.4 onPrepare guard backstops.
  assertCapabilityEnv(capabilityKindOf(opts.appConfig.deviceType), { ...ambient, ...runEnv });

  // Run context the worker reads to rebuild the DeviceContext and scope for run-session (ADR-018).
  const contextEnv: Record<string, string> = {
    AIMTAP_APP_VERSION: opts.deviceContext.app_version,
    AIMTAP_DEVICE_TYPE: opts.appConfig.deviceType,
    AIMTAP_SCOPE_KIND: opts.scope.kind,
  };
  if (opts.scope.criteria !== null) contextEnv.AIMTAP_SCOPE_CRITERIA = opts.scope.criteria;

  // Inject the per-run env; the worker inherits it and reads it in capabilities and run assembly.
  for (const [key, value] of Object.entries({ ...runEnv, ...contextEnv })) ambient[key] = value;

  const configPath = wdioConfigPath(opts.appConfig.deviceType, opts.configDir);
  const make = opts.makeLauncher ?? defaultLauncher;
  const launcher = await make(configPath, scopeToLauncherArgs(opts.scope));
  const exitCode = (await launcher.run()) ?? 0;
  return { runId: opts.runId, exitCode };
}
