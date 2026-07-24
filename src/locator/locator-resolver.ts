import { $ } from '@wdio/globals';
import { AppFailure, logger } from '../shared/index.js';
import { describeLocator, toSelector, type Locator } from './locator.js';
import { getWaitPolicy } from './wait-policy.js';

// The single point where the platform finds an element, and the Phase 2 self-healing insertion
// point (ADR-004). The resolver reads the global WebdriverIO session and never imports the Test
// Runner; the screen name travels through a sink the Test Runner injects at session open (ADR-014).

export type Element = Awaited<ReturnType<typeof $>>;

export type ScreenSink = (screenName: string) => void;

let screenSink: ScreenSink | null = null;

/** Test Runner injects the sink when the session opens. Without one the screen name is dropped. */
export function registerScreenSink(sink: ScreenSink): void {
  screenSink = sink;
}

export function clearScreenSink(): void {
  screenSink = null;
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

/** Find one element, waiting under the shared policy. Throws AppFailure when it never appears. */
export async function find(locator: Locator, screenName: string): Promise<Element> {
  reportScreen(screenName);

  const policy = getWaitPolicy();
  const selector = toSelector(locator);
  const element = await $(selector);

  try {
    await element.waitForExist({ timeout: policy.timeoutMs, interval: policy.intervalMs });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new AppFailure(
      `Element not found on ${screenName}: ${describeLocator(locator)} (${reason})`,
      { screen: screenName, selector, timeout_ms: policy.timeoutMs },
    );
  }

  return element;
}
