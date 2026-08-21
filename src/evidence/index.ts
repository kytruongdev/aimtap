// Evidence Collector - execution log, screenshots, failure classification, result assembly.
// TICKET-013: execution log. TICKET-014: screenshot writer. TICKET-015: failure classifier.
// TICKET-016: evidence collector that assembles these into a result and pushes it to the store.
export { createExecutionLog } from './execution-log.js';
export type { ExecutionLog, StepInput, StepRecord } from './execution-log.js';

export { captureScreenshot } from './screenshot-writer.js';
export type { Screenshotter, ScreenshotResult, ScreenshotTarget } from './screenshot-writer.js';

export { classifyFailure } from './failure-classifier.js';
export type { Classification } from './failure-classifier.js';

export { createEvidenceCollector } from './evidence-collector.js';
export type {
  EvidenceCollector,
  EvidenceCollectorDeps,
  ScenarioInfo,
  StepEvent,
  HealSignalInput,
} from './evidence-collector.js';
