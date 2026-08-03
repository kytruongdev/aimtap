import { randomUUID } from 'node:crypto';
import { browser } from '@wdio/globals';
import { PlatformFailure, type DeviceType } from '../shared/index.js';
import { openDatabase, createRunRepository } from '../store/index.js';
import { createEvidenceCollector, type Screenshotter } from '../evidence/index.js';
import type { DeviceContext } from '../device/index.js';
import type { ProbeSession } from '../device/index.js';
import { createRunSession, type RunSession } from './run-session.js';
import { createCucumberHooks, type CucumberHooks } from './cucumber-hooks.js';

// TICKET-021 (ADR-018): the worker-side run assembly. AimtapService calls this in its `before` hook,
// where the global WebdriverIO session exists. It rebuilds the run context from the env the CLI
// injected (AIMTAP_RUN_ID + capability/context keys), opens the app's Result Store, and wires the
// Evidence Collector, run-session and Cucumber hooks together. run-session takes its run-id from the
// env (newRunId), so the CLI owns the id and no worker -> CLI channel is needed. This wires live
// collaborators (the WDIO browser, the SQLite store) and is verified when a real run executes.

export interface WorkerRun {
  session: RunSession;
  hooks: CucumberHooks;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (value === undefined || value === '') {
    throw new PlatformFailure(`Worker run environment is missing ${key}`, { key });
  }
  return value;
}

export function assembleWorkerRun(env: NodeJS.ProcessEnv = process.env): WorkerRun {
  const runId = required(env, 'AIMTAP_RUN_ID');
  const appId = required(env, 'AIMTAP_APP_ID');
  const outputDir = env.AIMTAP_OUTPUT_DIR;

  const device: DeviceContext = {
    device_id: env.AIMTAP_UDID ?? required(env, 'AIMTAP_DEVICE_NAME'),
    device_type: (env.AIMTAP_DEVICE_TYPE as DeviceType | undefined) ?? 'simulator',
    os_version: required(env, 'AIMTAP_PLATFORM_VERSION'),
    app_version: required(env, 'AIMTAP_APP_VERSION'),
  };
  const scope = {
    kind: env.AIMTAP_SCOPE_KIND === 'subset' ? ('subset' as const) : ('full_suite' as const),
    criteria: env.AIMTAP_SCOPE_CRITERIA ?? null,
  };

  const db = openDatabase(appId, outputDir);
  const repository = createRunRepository(db);

  const evidence = createEvidenceCollector({
    repository,
    screenshotter: browser as unknown as Screenshotter,
    appId,
    runId,
    newId: () => randomUUID(),
    outputDir,
  });

  const session = createRunSession({
    repository,
    appId,
    device,
    scope,
    newRunId: () => runId,
  });

  const hooks = createCucumberHooks({
    session,
    evidence,
    getProbeSession: () => browser as unknown as ProbeSession,
  });

  return { session, hooks };
}
