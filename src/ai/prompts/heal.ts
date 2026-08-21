import { LOCATOR_STRATEGIES } from '../../shared/index.js';

// Heal prompt (ADR-025, read-only mode): give the CLI the broken locator, the screen, and the live
// page source, and ask it to return exactly one replacement locator in a fixed JSON shape. Kept as a
// pure builder so the AI Gateway can unit-test the prompt content without invoking the CLI.

export interface HealPromptContext {
  expectedLocator: string;
  screenName: string;
  pageSource: string;
}

export function buildHealPrompt(ctx: HealPromptContext): string {
  const strategies = LOCATOR_STRATEGIES.join(', ');
  return [
    'You are helping an automated iOS (XCUITest) test recover from a locator that no longer matches.',
    `Screen: ${ctx.screenName}`,
    `The expected locator that failed: ${ctx.expectedLocator}`,
    '',
    'Using the accessibility page source below, find the single element the test intended and return',
    'one replacement locator. Respond with ONLY a JSON object, no prose, in exactly this shape:',
    '{"strategy": "<strategy>", "selector": "<selector>"}',
    `where <strategy> is one of: ${strategies}.`,
    'Do not modify any files.',
    '',
    'Page source:',
    ctx.pageSource,
  ].join('\n');
}
