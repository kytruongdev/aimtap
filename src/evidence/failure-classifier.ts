import { isAppFailure, ASSERTION_SENTINEL } from '../shared/index.js';
import type { FailureType } from '../store/index.js';

// Maps the error at a failing step to its BR-014 failure_type, using the AppFailure kind discriminant
// (ADR-016). The original message is always kept (FR-EXEC-10).
//
// PlatformFailure is not a test case failure - it flows down the device/run path (BR-018) and must be
// filtered by the caller (isPlatformFailure) before a test case result is written. If one ever reaches
// here it maps defensively to step_not_executed.
//
// Cucumber boundary (ADR-016): the framework reduces the step error to its message string before it
// reaches here, so the AppFailure object (and kind) is gone. The assertion kind is recovered from the
// sentinel prefix carried in the message, then stripped so error_message stays original. The
// in-process path (object still intact) still uses the kind discriminant directly.

export interface Classification {
  failure_type: FailureType;
  error_message: string;
}

export function classifyFailure(error: unknown): Classification {
  let error_message = error instanceof Error ? error.message : String(error);

  const bySentinel = error_message.includes(ASSERTION_SENTINEL);
  if (bySentinel) error_message = error_message.replace(ASSERTION_SENTINEL, '');

  const isAssertion = (isAppFailure(error) && error.kind === 'assertion') || bySentinel;
  const failure_type: FailureType = isAssertion ? 'wrong_conclusion' : 'step_not_executed';

  return { failure_type, error_message };
}
