import WDIOReporter, { type SuiteStats } from '@wdio/reporter';

// TICKET-022 (ADR-018 Phương án a): live progress is a WDIO reporter that runs in the worker and
// prints each test case as it finishes, reusing the testrunner's reporting mechanism (ADR-013) — no
// cross-process event channel. With @wdio/cucumber-framework a Feature is a suite and a Scenario is a
// nested suite, so a test case = a scenario suite; its steps are the suite's tests. The ProgressTracker
// holds the pure formatting/counting and is unit-tested; the reporter maps WDIO events onto it and is
// verified when a real run executes (conventions §3.1).

export type ScenarioStatus = 'passed' | 'failed';

export class ProgressTracker {
  private completed = 0;

  constructor(
    private readonly out: (line: string) => void,
    private readonly total: number | null = null,
  ) {}

  private counter(): string {
    return this.total === null ? `${this.completed}` : `${this.completed}/${this.total}`;
  }

  scenarioStart(feature: string, scenario: string): void {
    this.out(`→ (${this.counter()}) ${feature} › ${scenario}`);
  }

  scenarioEnd(feature: string, scenario: string, status: ScenarioStatus): void {
    this.completed += 1;
    const mark = status === 'passed' ? 'PASS' : 'FAIL';
    this.out(`[${mark}] (${this.counter()}) ${feature} › ${scenario}`);
  }
}

export default class ProgressReporter extends WDIOReporter {
  private readonly tracker: ProgressTracker;
  private feature = '';
  private scenarioFailed = false;

  constructor(options: ConstructorParameters<typeof WDIOReporter>[0]) {
    super(options);
    this.tracker = new ProgressTracker((line) => this.write(`${line}\n`));
  }

  override onSuiteStart(suite: SuiteStats): void {
    if (suite.type === 'feature') {
      this.feature = suite.title;
    } else if (suite.type === 'scenario') {
      this.scenarioFailed = false;
      this.tracker.scenarioStart(this.feature, suite.title);
    }
  }

  override onTestFail(): void {
    this.scenarioFailed = true;
  }

  override onSuiteEnd(suite: SuiteStats): void {
    if (suite.type === 'scenario') {
      this.tracker.scenarioEnd(this.feature, suite.title, this.scenarioFailed ? 'failed' : 'passed');
    }
  }
}
