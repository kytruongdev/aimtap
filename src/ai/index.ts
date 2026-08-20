// AI Gateway — the single place the platform calls an external AI CLI (ADR-025).
// US-6.2: CodeAgent port + control point (TICKET-030) and the Claude Code subprocess adapter
// (TICKET-031). Heal/generate content builds on this port in US-7.2 / US-8.1.
export { createCodeAgent } from './code-agent.js';
export type { CodeAgent, AgentMode, AgentLimits } from './code-agent.js';
