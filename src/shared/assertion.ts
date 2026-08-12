import { AppFailure, PlatformFailure } from './errors.js';

// Platform assertion mechanism (ADR-016). Step definitions wrap their checks so that a failed
// assertion is thrown as an AppFailure tagged 'assertion', which the failure classifier maps to
// wrong_conclusion. Authors keep using the matchers they like (e.g. expect-webdriverio) inside the
// callback; only the tagging is added. A raw assertion that skips this helper falls back to
// step_not_executed - misclassified but recoverable later from error_message (BR-014).
//
// An already-classified failure passes through unchanged: an AppFailure keeps its own kind, and a
// PlatformFailure (e.g. a matcher that polls the device when the session is lost) is never rewrapped
// as an assertion, so it stays on the device/run path and is not recorded as a test case failure
// (ADR-016 consequence).
//
// Cross-boundary (ADR-016): @wdio/cucumber-framework hands the failing step's error to afterStep as a
// plain message string (world.result.message), so the AppFailure object - and its kind - do not
// survive to the failure classifier. The kind is therefore carried inside the message as a stable
// sentinel prefix, which the classifier recognises and strips (keeping the original message).

/** Marker carried in an assertion failure's message so its kind survives Cucumber's string boundary. */
export const ASSERTION_SENTINEL = '[[aimtap:assertion]] ';

export async function assertExpectation(assertion: () => void | Promise<void>): Promise<void> {
  try {
    await assertion();
  } catch (error) {
    if (error instanceof AppFailure || error instanceof PlatformFailure) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new AppFailure(`${ASSERTION_SENTINEL}${message}`, undefined, 'assertion');
  }
}
