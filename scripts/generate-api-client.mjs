// Regenerates backend/openapi.json from the FastAPI app and the typed client
// schema at frontend/src/api/schema.d.ts. CI runs this and fails on any diff.
//
// Usage: npm run generate:api
// Uses $BL_PYTHON, else backend/.venv's python, else "python" on PATH.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'backend');
const venvPython = process.platform === 'win32'
  ? join(apiDir, '.venv', 'Scripts', 'python.exe')
  : join(apiDir, '.venv', 'bin', 'python');
const python = process.env.BL_PYTHON || (existsSync(venvPython) ? venvPython : 'python');

execFileSync(python, ['-m', 'app.export_openapi', 'openapi.json'], { cwd: apiDir, stdio: 'inherit' });
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js'),
    join(apiDir, 'openapi.json'),
    '--output',
    join(root, 'frontend', 'src', 'api', 'schema.d.ts')
  ],
  { cwd: root, stdio: 'inherit' }
);
