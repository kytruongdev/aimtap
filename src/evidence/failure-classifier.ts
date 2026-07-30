import { isAppFailure } from '../shared/index.js';
import type { FailureType } from '../store/index.js';

// Maps the error at a failing step to its BR-014 failure_type, using the AppFailure kind
// discriminant (ADR-016). The original message is always kept (FR-EXEC-10).
//
// PlatformFailure is not a test case failure - it flows down the device/run path (BR-018) and must
// be filtered by the caller (isPlatformFailure) before a test case result is written. If one ever
// reaches here it maps defensively to step_not_executed.

export interface Classification {
  failure_type: FailureType;
  error_message: string;
}

export function classifyFailure(error: unknown): Classification {
  const error_message = error instanceof Error ? error.message : String(error);

  const failure_type: FailureType =
    isAppFailure(error) && error.kind === 'assertion' ? 'wrong_conclusion' : 'step_not_executed';

  return { failure_type, error_message };
}
