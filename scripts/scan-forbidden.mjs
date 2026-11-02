// Fails if the repository contains material that must never be committed:
// the previous vendor's name or packages, or public IPv4 addresses (real
// visitor data). Runs in CI on every PR; run locally with `npm run scan`.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.venv', 'dist', '__pycache__', '.pytest_cache', '.ruff_cache']);
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|eot|zip|pdf)$/i;
const SELF = relative(root, fileURLToPath(import.meta.url)).split(sep).join('/');

// Built from parts so this file does not match itself.
const VENDOR = new RegExp(['jot', 'form'].join(''), 'i');
const VENDOR_SCOPE = new RegExp(['@', 'jot', 'forminc'].join(''), 'i');
// An IPv4 address standing alone (not part of a version string like Chrome/131.0.0.0).
const IPV4 = /(?<![\w./-])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\w.-])/g;

const isAllowedIp = octets => {
  const [a, b] = octets;
  if (octets.some(octet => octet > 255)) {
    return true; // not an address at all
  }
  return a === 127 || a === 10 || a === 0
    || (a === 192 && b === 168)
    || (a === 172 && b >= 16 && b <= 31);
};

const listFiles = () => {
  try {
    const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').filter(Boolean);
  } catch (error) {
    // Not a git repository yet: walk the tree.
    const walk = dir => readdirSync(dir).flatMap(name => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        return SKIP_DIRS.has(name) ? [] : walk(full);
      }
      return [relative(root, full).split(sep).join('/')];
    });
    return walk(root);
  }
};

const problems = [];
for (const file of listFiles()) {
  if (file === SELF || BINARY.test(file)) {
    continue;
  }
  let text;
  try {
    text = readFileSync(join(root, file), 'utf8');
  } catch (error) {
    continue;
  }
  if (VENDOR.test(file)) {
    problems.push(`${file}: file name mentions the previous vendor`);
  }
  text.split('\n').forEach((line, index) => {
    if (VENDOR.test(line) || VENDOR_SCOPE.test(line)) {
      problems.push(`${file}:${index + 1}: mentions the previous vendor`);
    }
    for (const match of line.matchAll(IPV4)) {
      const octets = match.slice(1, 5).map(Number);
      if (!isAllowedIp(octets)) {
        problems.push(`${file}:${index + 1}: public IPv4 address ${match[0]}`);
      }
    }
  });
}

if (problems.length) {
  console.error(`Forbidden content found (${problems.length}):`);
  problems.slice(0, 200).forEach(problem => console.error(`  ${problem}`));
  process.exit(1);
}
console.log('Scan passed: no vendor references or public IP addresses.');
