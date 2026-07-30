// In-memory execution log of one test case: the steps in order, each with its result, duration and
// the original error at the failing step (UC-07, BR-010). Built in memory only - no separate log
// file next to the Result Store (coding-convention.md). Evidence Collector (TICKET-016) turns these
// records into StepLog rows when it persists the test case.

export interface StepRecord {
  readonly step_order: number;
  readonly step_text: string;
  readonly result: 'passed' | 'failed';
  readonly duration_ms: number;
  readonly error_message: string | null;
  readonly screenshot_path: string | null;
}

export interface StepInput {
  step_text: string;
  result: 'passed' | 'failed';
  duration_ms: number;
  error_message?: string | null;
  screenshot_path?: string | null;
}

export interface ExecutionLog {
  /** Append a step; its order is assigned from the sequence in which steps are recorded. */
  record(step: StepInput): void;
  /** The steps recorded so far, in order. Returns a copy; records are readonly. */
  steps(): StepRecord[];
}

export function createExecutionLog(): ExecutionLog {
  const steps: StepRecord[] = [];

  return {
    record(step) {
      steps.push({
        step_order: steps.length + 1,
        step_text: step.step_text,
        result: step.result,
        duration_ms: step.duration_ms,
        error_message: step.error_message ?? null,
        screenshot_path: step.screenshot_path ?? null,
      });
    },

    steps() {
      return [...steps];
    },
  };
}
