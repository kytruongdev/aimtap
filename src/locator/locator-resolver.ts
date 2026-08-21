import { $, browser } from '@wdio/globals';
import { AppFailure, getWaitPolicy, logger, type Locator, type WaitPolicy } from '../shared/index.js';
import { describeLocator, toSelector } from './locator.js';

// The single point where the platform finds an element, and the Phase 2 self-healing insertion
// point (ADR-004). The resolver reads the global WebdriverIO session and never imports the Test
// Runner, the AI Gateway or Evidence; the screen name, the healer and the heal sink all travel
// through injected sinks/functions the assembly layer wires at session open (ADR-014). The shared
// wait policy lives in Shared (ADR-015).

export type Element = Awaited<ReturnType<typeof $>>;

export type ScreenSink = (screenName: string) => void;

/** A healer supplied by the assembly layer; wraps the AI Gateway so `locator` never imports `ai`. */
export type HealFn = (ctx: {
  expectedLocator: string;
  screenName: string;
  pageSource: string;
}) => Promise<Locator | null>;

/**
 * What the resolver knows about a heal at find time. stepOrder, testCaseResultId and screenshot_path
 * are NOT here — find(locator, screenName) has a stable signature (ADR-004) so the resolver has no
 * step number; Evidence enriches those in US-7.3, the same way it attaches the screenshot after
 * capture. A subset of the store's HealEvent (US-7.1).
 */
export interface HealSignal {
  screen: string;
  expectedLocator: string;
  usedLocator: string;
  occurredAt: string;
}

export type HealSink = (signal: HealSignal) => void;

const DEFAULT_HEAL_RETRIES = 3;

let screenSink: ScreenSink | null = null;
let healer: HealFn | null = null;
let healRetries = DEFAULT_HEAL_RETRIES;
let healSink: HealSink | null = null;
// Locators recovered in this run, keyed by the original locator, so the same break reuses the fix
// without calling the AI again (BR-202).
const healCache = new Map<string, Locator>();

/** Test Runner injects the sink when the session opens. Without one the screen name is dropped. */
export function registerScreenSink(sink: ScreenSink): void {
  screenSink = sink;
}

export function clearScreenSink(): void {
  screenSink = null;
}

/** Assembly injects the healer at session open; without one, find behaves exactly as Phase 1. */
export function registerHealer(fn: HealFn, retries: number = DEFAULT_HEAL_RETRIES): void {
  healer = fn;
  healRetries = retries;
  healCache.clear();
}

export function clearHealer(): void {
  healer = null;
  healRetries = DEFAULT_HEAL_RETRIES;
  healCache.clear();
}

/** Assembly injects the sink that carries a HealSignal to Evidence (US-7.3), avoiding a direct edge. */
export function registerHealSink(sink: HealSink): void {
  healSink = sink;
}

export function clearHealSink(): void {
  healSink = null;
}

function reportScreen(screenName: string): void {
  if (screenSink === null) return;
  try {
    screenSink(screenName);
  } catch (error) {
    // The screen name is evidence, never the thing under test (BR-004): report it and carry on.
    logger.warn({ err: error, screen: screenName }, 'screen sink failed');
  }
}

function reportHeal(original: Locator, used: Locator, screenName: string): void {
  if (healSink === null) return;
  const signal: HealSignal = {
    screen: screenName,
    expectedLocator: describeLocator(original),
    usedLocator: describeLocator(used),
    occurredAt: new Date().toISOString(),
  };
  try {
    healSink(signal);
  } catch (error) {
    // Evidence is auxiliary (BR-004): a failing sink must not change the test outcome.
    logger.warn({ err: error, screen: screenName }, 'heal sink failed');
  }
}

/** Try to locate a candidate locator live; return the element if it appears, else null. */
async function locate(candidate: Locator, policy: WaitPolicy): Promise<Element | null> {
  const element = await $(toSelector(candidate));
  try {
    await element.waitForExist({ timeout: policy.timeoutMs, interval: policy.intervalMs });
    return element;
  } catch {
    return null;
  }
}

/**
 * Attempt self-healing for a locator that did not appear: reuse a cached fix if any, otherwise ask
 * the healer up to healRetries times, trying each returned locator live. On success push a HealSignal
 * and return the element; on exhaustion (or any AI failure) return null so the caller fails as in
 * Phase 1 (BR-208). Never throws.
 */
async function tryHeal(
  locator: Locator,
  screenName: string,
  policy: WaitPolicy,
): Promise<Element | null> {
  if (healer === null) return null;
  const key = describeLocator(locator);

  const cached = healCache.get(key);
  if (cached !== undefined) {
    const element = await locate(cached, policy);
    if (element !== null) {
      reportHeal(locator, cached, screenName);
      return element;
    }
    healCache.delete(key);
  }

  for (let attempt = 0; attempt < healRetries; attempt += 1) {
    let pageSource: string;
    try {
      pageSource = await browser.getPageSource();
    } catch {
      return null;
    }

    let candidate: Locator | null;
    try {
      candidate = await healer({ expectedLocator: key, screenName, pageSource });
    } catch {
      // The healer contract is not to throw (BR-208); guard anyway so a run never dies on the AI path.
      return null;
    }
    if (candidate === null) continue;

    const element = await locate(candidate, policy);
    if (element !== null) {
      healCache.set(key, candidate);
      reportHeal(locator, candidate, screenName);
      return element;
    }
  }

  return null;
}

/** Find one element, waiting under the shared policy. Throws AppFailure when it never appears. */
export async function find(locator: Locator, screenName: string): Promise<Element> {
  reportScreen(screenName);

  const policy = getWaitPolicy();
  const selector = toSelector(locator);
  const element = await $(selector);

  try {
    await element.waitForExist({ timeout: policy.timeoutMs, interval: policy.intervalMs });
    return element;
  } catch (error) {
    const healed = await tryHeal(locator, screenName, policy);
    if (healed !== null) return healed;

    const reason = error instanceof Error ? error.message : String(error);
    throw new AppFailure(
      `Element not found on ${screenName}: ${describeLocator(locator)} (${reason})`,
      { screen: screenName, selector, timeout_ms: policy.timeoutMs },
    );
  }
}
