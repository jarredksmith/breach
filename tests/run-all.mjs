// Runs every test-*.mjs as its own process; prints a summary; exits non-zero if any fail.
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir).filter(f => /^test-.*\.mjs$/.test(f)).sort();
let pass = 0, fail = 0;
console.log(`BREACH test suite — ${files.length} harnesses\n`);
for (const f of files) {
  const r = spawnSync('node', ['--experimental-vm-modules', path.join(dir, f)], { encoding: 'utf8' });
  const out = (r.stdout || '').trim();
  const lines = out.split('\n').filter(l => !/ExperimentalWarning|--trace-warnings|node --/.test(l));
  process.stdout.write(lines.join('\n') + '\n');
  if (r.status === 0) pass++; else { fail++; if (r.stderr && r.stderr.trim()) console.log('         stderr: ' + r.stderr.trim().split('\n')[0]); }
}
console.log(`\n${pass}/${files.length} harnesses passed${fail ? `, ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
