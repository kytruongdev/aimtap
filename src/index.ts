// Public entry point of the platform — the only module that apps/ may import from.
// Re-exports grow as modules are implemented; Phase 1 US-1.1 exposes the shared kernel.
export * from './shared/index.js';
