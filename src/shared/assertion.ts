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

export async function assertExpectation(assertion: () => void | Promise<void>): Promise<void> {
  try {
    await assertion();
  } catch (error) {
    if (error instanceof AppFailure || error instanceof PlatformFailure) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new AppFailure(message, undefined, 'assertion');
  }
}
