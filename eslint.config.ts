import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

// Module-boundary enforcement (north-star.md §2.1, ADR-002).
//
// The `element-types` matrix below encodes the ratified Phase 1 module dependency graph
// (north-star.md §2, ADR-014). The Test Runner ↔ Locator Resolver cycle is broken by having
// `locator` depend only on `shared`: the current screen is pushed via a sink that the Test Runner
// injects at session open (registerScreenSink), so the relationship runs one way, Test Runner →
// Locator Resolver. CLI depends on Registry and Reporter; every internal module may import `shared`.

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage', 'output', 'docs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'apps/**/*.ts', 'config/**/*.ts'],
    plugins: { boundaries },
    settings: {
      // Resolve NodeNext `.js` specifiers to their `.ts` sources so eslint-plugin-boundaries can
      // classify imports and actually enforce the matrix (without this the rules are inert).
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/**/*.ts', 'apps/**/*.ts'],
      'boundaries/elements': [
        { type: 'root', mode: 'file', pattern: 'src/index.ts' },
        { type: 'shared', mode: 'folder', pattern: 'src/shared' },
        { type: 'config', mode: 'folder', pattern: 'src/config' },
        { type: 'ai', mode: 'folder', pattern: 'src/ai' },
        { type: 'registry', mode: 'folder', pattern: 'src/registry' },
        { type: 'store', mode: 'folder', pattern: 'src/store' },
        { type: 'reporter', mode: 'folder', pattern: 'src/reporter' },
        { type: 'evidence', mode: 'folder', pattern: 'src/evidence' },
        { type: 'locator', mode: 'folder', pattern: 'src/locator' },
        { type: 'device', mode: 'folder', pattern: 'src/device' },
        { type: 'runner', mode: 'folder', pattern: 'src/runner' },
        { type: 'cli', mode: 'folder', pattern: 'src/cli' },
        { type: 'app-features', mode: 'folder', pattern: 'apps/*/features', capture: ['app'] },
        { type: 'app-steps', mode: 'folder', pattern: 'apps/*/steps', capture: ['app'] },
        { type: 'app-screens', mode: 'folder', pattern: 'apps/*/screens', capture: ['app'] },
        { type: 'app-fixtures', mode: 'folder', pattern: 'apps/*/fixtures', capture: ['app'] },
        { type: 'app', mode: 'folder', pattern: 'apps/*', capture: ['app'] },
      ],
    },
    rules: {
      // Cross-element imports must go through the element's index.ts (public surface).
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              target: [
                'root',
                'shared',
                'config',
                'ai',
                'registry',
                'store',
                'reporter',
                'evidence',
                'locator',
                'device',
                'runner',
                'cli',
              ],
              allow: 'index.ts',
            },
            { target: ['app', 'app-features', 'app-steps', 'app-screens', 'app-fixtures'], allow: '**' },
          ],
        },
      ],
      // Allowed dependency directions. Everything internal may import `shared`; nothing imports `cli`.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['shared'], allow: [] },
            { from: ['config'], allow: ['shared'] },
            { from: ['ai'], allow: ['shared', 'config'] },
            { from: ['registry'], allow: ['shared'] },
            { from: ['store'], allow: ['shared'] },
            { from: ['locator'], allow: ['shared'] },
            { from: ['evidence'], allow: ['shared', 'store'] },
            { from: ['reporter'], allow: ['shared', 'store'] },
            { from: ['device'], allow: ['shared', 'registry'] },
            { from: ['runner'], allow: ['shared', 'device', 'evidence', 'locator', 'store'] },
            { from: ['cli'], allow: ['shared', 'config', 'registry', 'device', 'runner', 'reporter'] },
            {
              from: ['root'],
              allow: [
                'shared',
                'config',
                'registry',
                'store',
                'reporter',
                'evidence',
                'locator',
                'device',
                'runner',
                'cli',
              ],
            },
            // apps/ reach the platform only through its public entry (src/index.ts = root).
            { from: ['app-features'], allow: [] },
            { from: ['app-steps'], allow: ['root', 'app-screens', 'app-fixtures'] },
            { from: ['app-fixtures'], allow: ['root'] },
            { from: ['app-screens'], allow: ['root'] },
            { from: ['app'], allow: ['root'] },
          ],
        },
      ],
    },
  },
);
