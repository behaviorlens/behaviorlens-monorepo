// Builds the two browser bundles:
//   dist/bl.js        snippet loader (humans; <script src> on the site, sends over HTTP)
//   dist/bl-agent.js  init-script loader (agents; Playwright add_init_script, sends over the bridge)
// Both bundle the same core, so human and agent sessions share one format.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');

const entries = [
  { entry: 'src/loaders/snippet.js', file: 'bl.js', name: 'BehaviorLensSnippet' },
  { entry: 'src/loaders/agent.js', file: 'bl-agent.js', name: 'BehaviorLensAgent' }
];

for (const [index, { entry, file, name }] of entries.entries()) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: 'dist',
      emptyOutDir: index === 0,
      sourcemap: true,
      minify: true,
      target: 'es2019',
      watch: watch ? {} : null,
      lib: {
        entry: resolve(root, entry),
        formats: ['iife'],
        name,
        fileName: () => file
      }
    }
  });
  console.log(`built dist/${file}${watch ? ' (watching)' : ''}`);
}
