// Starts the AI service with whatever Python it can find.
// Order: $PYTHON env var -> `python` -> `py -3` -> common Windows install paths.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const AI_DIR = join(import.meta.dirname, '..', 'ai-service');

function works(cmd, args) {
  try {
    const r = spawnSync(cmd, [...args, '--version'], { stdio: 'ignore' });
    return r.status === 0;
  } catch {
    return false;
  }
}

const candidates = [];
if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
candidates.push(['python', []], ['python3', []], ['py', ['-3']]);
for (const v of ['313', '312', '311', '310']) {
  candidates.push([join(homedir(), 'AppData', 'Local', 'Programs', 'Python', `Python${v}`, 'python.exe'), []]);
}

let picked = null;
for (const [cmd, pre] of candidates) {
  if ((cmd.includes('/') || cmd.includes('\\')) && !existsSync(cmd)) continue;
  if (works(cmd, pre)) {
    picked = [cmd, pre];
    break;
  }
}

if (!picked) {
  console.error(
    '\n[run-ai] Could not find a working Python.\n' +
      '        Install Python 3.10-3.12 with "Add python.exe to PATH",\n' +
      '        or set PYTHON to its full path, e.g.\n' +
      '        PYTHON="C:\\\\Python312\\\\python.exe" npm run dev\n'
  );
  process.exit(1);
}

const [cmd, pre] = picked;
console.log(`[run-ai] using ${cmd} ${pre.join(' ')}`.trim());
const child = spawn(cmd, [...pre, '-m', 'uvicorn', 'app:app', '--port', '8000', '--reload'], {
  cwd: AI_DIR,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
