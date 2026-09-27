/**
 * Runs a node script and prints a clear PASSED / FAILED banner in the terminal.
 * Usage: node scripts/run-with-banner.js <scriptPath> "Display Name"
 */
const { spawnSync } = require('child_process');
const path = require('path');

const scriptArg = process.argv[2];
const name = process.argv[3] || 'Test';

if (!scriptArg) {
  console.error('Usage: node scripts/run-with-banner.js <script> "Name"');
  process.exit(2);
}

const script = path.resolve(scriptArg);
const result = spawnSync(process.execPath, [script, ...process.argv.slice(4)], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

const code = result.status === null ? 1 : result.status;
const line = '='.repeat(56);

if (code === 0) {
  console.log(`\n${line}`);
  console.log(`  RESULT: PASSED  — ${name}`);
  console.log(`${line}\n`);
} else {
  console.log(`\n${line}`);
  console.log(`  RESULT: FAILED  — ${name}`);
  console.log(`  exit code: ${code}`);
  console.log(`${line}\n`);
}

process.exit(code);
