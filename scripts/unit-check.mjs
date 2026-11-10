import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// Passability uses a browser; every other .cjs file is an isolated unit check.
const tests = readdirSync(new URL('../tests/', import.meta.url))
  .filter((file) => file.endsWith('.cjs') && file !== 'passability.cjs')
  .sort();

for (const test of tests) {
  const result = spawnSync(process.execPath, ['tests/' + test], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PASS: ${tests.length} unit suites`);
