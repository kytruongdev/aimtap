import { randomUUID } from 'node:crypto';
import { browser } from '@wdio/globals';
import { PlatformFailure, type DeviceType } from '../shared/index.js';
import { openDatabase, createRunRepository } from '../store/index.js';
import {
  createEvidenceCollector,
  type Screenshotter,
  type HealSignalInput,
} from '../evidence/index.js';
import { createCodeAgent, healLocator, type CodeAgent } from '../ai/index.js';
import { registerHealer, registerHealSink, type HealFn } from '../locator/index.js';
import type { DeviceContext } from '../device/index.js';
import type { ProbeSession } from '../device/index.js';
import { createRunSession, type RunSession } from './run-session.js';
import { createCucumberHooks, type CucumberHooks } from './cucumber-hooks.js';

// Platform defaults for the AI control point (NFR-202). The primary cost control is the per-locator
// retry count (healRetries, BR-202) plus the resolver's in-run cache; these are a defensive per-run
// call cap and a hard per-call timeout so a stuck CLI cannot hang the run.
const AI_MAX_CALLS_PER_RUN = 50;
const AI_CALL_TIMEOUT_MS = 120_000;

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

/**
 * Wire self-healing at session open: build the AI Gateway, register a healer that calls it, and route
 * heal signals to Evidence — but only when AI is enabled for this app (BR-209). When it is off (or the
 * token is missing, which makes the agent return null), nothing is injected and find behaves exactly
 * as Phase 1 (BR-208). The AI Gateway is joined to the Locator Resolver and Evidence only here, via
 * injected sinks (ADR-014) — no `locator → ai`/`locator → evidence` edge. The collaborator hooks are
 * seams so this is unit-testable without the real gateway or global session.
 */
export function wireSelfHealing(opts: {
  aiEnabled: boolean;
  healRetries: number;
  onHeal: (signal: HealSignalInput) => void;
  deps?: {
    createAgent?: () => CodeAgent;
    setHealer?: typeof registerHealer;
    setHealSink?: typeof registerHealSink;
  };
}): void {
  if (!opts.aiEnabled) return;

  const createAgent =
    opts.deps?.createAgent ??
    (() =>
      createCodeAgent({
        cli: 'claude-code',
        limits: { maxCallsPerRun: AI_MAX_CALLS_PER_RUN, callTimeoutMs: AI_CALL_TIMEOUT_MS },
      }));
  const setHealer = opts.deps?.setHealer ?? registerHealer;
  const setHealSink = opts.deps?.setHealSink ?? registerHealSink;

  const agent = createAgent();
  const healFn: HealFn = (ctx) => healLocator(agent, ctx);
  setHealer(healFn, opts.healRetries);
  setHealSink(opts.onHeal);
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

  const db = openDatabase();
  const repository = createRunRepository(db);

  const evidence = createEvidenceCollector({
    repository,
    screenshotter: browser as unknown as Screenshotter,
    appId,
    runId,
    newId: () => randomUUID(),
    outputDir,
  });

  // Wire self-healing into the Locator Resolver when AI is enabled for this app (US-7.5). The CLI
  // injects the switch via env from AppConfig.ai; a missing/invalid retry count falls back to 3.
  const parsedRetries = Number(env.AIMTAP_AI_HEAL_RETRIES);
  wireSelfHealing({
    aiEnabled: env.AIMTAP_AI_ENABLED === '1',
    healRetries: Number.isInteger(parsedRetries) && parsedRetries >= 1 ? parsedRetries : 3,
    onHeal: (signal) => evidence.onHeal(signal),
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
