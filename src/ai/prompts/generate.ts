// Generate prompt (ADR-025, limited-write mode): ask the CLI to draft a Cucumber test case (a
// .feature scenario, its step definitions and a Page Object) from a plain-language behaviour and the
// live page source, reusing existing steps before writing new ones (ADR-007, BR-212) and tagging the
// scenario @ai-generated so it stands out in review (FR-GEN-05, BR-216). Pure builder so the AI
// Gateway can unit-test the prompt without invoking the CLI.

export interface GeneratePromptContext {
  description: string;
  pageSource: string;
  /** Existing step-definition sentences, so the CLI reuses them instead of inventing duplicates. */
  existingSteps: string[];
}

export const AI_GENERATED_TAG = '@ai-generated';

export function buildGeneratePrompt(ctx: GeneratePromptContext): string {
  const existing =
    ctx.existingSteps.length > 0
      ? ctx.existingSteps.map((step) => `- ${step}`).join('\n')
      : '(none yet)';

  return [
    'You are drafting an automated iOS (XCUITest) test case for a Cucumber + WebdriverIO project.',
    '',
    'Behaviour to cover:',
    ctx.description,
    '',
    'Reuse the existing step definitions below before writing new ones — do not create a step whose',
    `meaning duplicates any of these (ADR-007):`,
    existing,
    '',
    'Rules:',
    '- Produce a .feature scenario (behaviour in plain English), its step definitions, and a Page Object.',
    '- Put every locator in the Page Object, never in the .feature file or the step definitions.',
    `- Tag the generated scenario ${AI_GENERATED_TAG} so it is distinguishable during review.`,
    '- Use the accessibility page source below to choose locators.',
    '',
    'Page source:',
    ctx.pageSource,
    '',
    'When done, respond with ONLY a JSON object listing the draft files you created, no prose:',
    '{"files": ["relative/path/to/file", ...]}',
  ].join('\n');
}
