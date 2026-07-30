import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../shared/index.js';

// Captures a screenshot at the failing step and at steps explicitly marked for capture (BR-003),
// writing it under output/<app-id>/screenshots/<run-id>/. Evidence is auxiliary, never the thing
// under test: a capture or write failure is reported as missing evidence and never thrown (BR-004),
// so it cannot change the test case status. The write is off the step's wait path and uses async
// fs so it does not block the event loop (NFR-10).

/** The screenshot source. In a run this is the WebdriverIO browser; a fake is used in unit tests. */
export interface Screenshotter {
  takeScreenshot(): Promise<string>; // base64-encoded PNG
}

export interface ScreenshotTarget {
  appId: string;
  runId: string;
  /** A name unique within the run, e.g. test case + step; sanitized into the file name. */
  name: string;
  outputDir?: string;
}

export interface ScreenshotResult {
  /** Relative path stored on the step (relative to output/<app-id>/), or null when it failed. */
  path: string | null;
  /** True when the capture or write failed (evidence missing, BR-004). */
  missing: boolean;
}

function defaultOutputDir(): string {
  return path.join(process.cwd(), 'output');
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

export async function captureScreenshot(
  screenshotter: Screenshotter,
  target: ScreenshotTarget,
): Promise<ScreenshotResult> {
  try {
    const base64 = await screenshotter.takeScreenshot();

    const outputDir = target.outputDir ?? defaultOutputDir();
    const runDir = path.join(outputDir, target.appId, 'screenshots', target.runId);
    await fs.mkdir(runDir, { recursive: true });

    const fileName = `${safeName(target.name)}.png`;
    await fs.writeFile(path.join(runDir, fileName), Buffer.from(base64, 'base64'));

    return { path: path.join('screenshots', target.runId, fileName), missing: false };
  } catch (error) {
    logger.warn({ err: error, screenshot: target.name }, 'screenshot capture failed');
    return { path: null, missing: true };
  }
}
