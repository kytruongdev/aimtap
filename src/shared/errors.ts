// Two error branches of the platform (north-star.md §2.2; coding-convention.md, error handling):
// - AppFailure: failure of the app under test — a valid result, recorded in the result record.
// - PlatformFailure: failure of the platform/environment — never recorded as "test case failed".

export interface FailureContext {
  readonly [key: string]: unknown;
}

export class AppFailure extends Error {
  readonly context: FailureContext | undefined;

  constructor(message: string, context?: FailureContext) {
    super(message);
    this.name = 'AppFailure';
    this.context = context;
    Object.setPrototypeOf(this, AppFailure.prototype);
  }
}

export class PlatformFailure extends Error {
  readonly context: FailureContext | undefined;

  constructor(message: string, context?: FailureContext) {
    super(message);
    this.name = 'PlatformFailure';
    this.context = context;
    Object.setPrototypeOf(this, PlatformFailure.prototype);
  }
}

export function isAppFailure(error: unknown): error is AppFailure {
  return error instanceof AppFailure;
}

export function isPlatformFailure(error: unknown): error is PlatformFailure {
  return error instanceof PlatformFailure;
}
