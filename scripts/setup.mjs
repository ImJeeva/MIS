// One-time first-run setup: installs everything, creates the MySQL database,
// applies migrations, and loads demo data. Safe to re-run and safe to
// interrupt (Ctrl+C) - each step remembers it already finished, so a retry
// only redoes whatever didn't complete. Delete the .setup/ folder at the repo
// root to force everything again.
import { existsSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STATE_DIR = path.join(ROOT, '.setup');
mkdirSync(STATE_DIR, { recursive: true });

// Prisma's CLI pings home for an update check unless this is set - on a slow
// or flaky connection that ping can hang for a long time and look "stuck".
const ENV = { ...process.env, CHECKPOINT_DISABLE: '1' };

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT, env: ENV, ...opts });
  return r.status === 0;
}

function done(step) {
  return existsSync(path.join(STATE_DIR, step));
}
function markDone(step) {
  writeFileSync(path.join(STATE_DIR, step), new Date().toISOString());
}
function once(step, label, fn) {
  if (done(step)) {
    console.log(`[setup] ${label} - already done, skipping`);
    return true;
  }
  const ok = fn();
  if (ok !== false) markDone(step);
  return ok !== false;
}

console.log('=== MIS setup - each step only runs once, safe to re-run ===');

// 1. server/.env
once('env', 'server/.env', () => {
  const envPath = path.join(ROOT, 'server', '.env');
  const envExample = path.join(ROOT, 'server', '.env.example');
  if (!existsSync(envPath)) {
    copyFileSync(envExample, envPath);
    console.log('[setup] created server/.env (MySQL root/root default - edit it if yours differs)');
  }
});

// 2. npm installs
for (const dir of ['.', 'server', 'client']) {
  once(`npm-${dir}`, `npm install (${dir})`, () => {
    if (existsSync(path.join(ROOT, dir, 'node_modules'))) return;
    return run('npm', ['install'], { cwd: path.join(ROOT, dir) });
  });
}

// 3. Python deps for the AI service (heuristic libs + TensorFlow for the real model)
function findPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const r = spawnSync(cmd, ['--version'], { shell: true });
    if (r.status === 0) return cmd;
  }
  return null;
}
once('pip', 'Python packages (fastapi + TensorFlow)', () => {
  const py = findPython();
  if (!py) {
    console.warn('[setup] Python not found on PATH - install Python 3.10-3.12 and re-run.');
    return false;
  }
  // Quick check first - if TensorFlow is already importable, skip the (slow) full install.
  const already = spawnSync(py, ['-c', 'import tensorflow, fastapi'], {
    shell: true,
    cwd: path.join(ROOT, 'ai-service'),
  });
  if (already.status === 0) {
    console.log('[setup] tensorflow + fastapi already importable - skipping pip install');
    return true;
  }
  return run(py, ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt', '-r', 'requirements-ml.txt'], {
    cwd: path.join(ROOT, 'ai-service'),
  });
});

// 4. create the database (uses the mysql CLI; tries PATH, then the common Windows install path)
const dbReady = once('db', 'MySQL database "mis"', () => {
  function tryCreateDb(mysqlCmd) {
    return run(mysqlCmd, [
      '-u', 'root', '-proot', '-e',
      '"CREATE DATABASE IF NOT EXISTS mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"',
    ]);
  }
  const ok = tryCreateDb('mysql') || tryCreateDb('"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"');
  if (!ok) {
    console.warn(
      '[setup] Could not auto-create the "mis" database (mysql CLI not found, or wrong ' +
        'credentials). Create it yourself (MySQL Workbench, or the mysql CLI):\n' +
        '  CREATE DATABASE mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n' +
        'then re-run this script - or just continue if you already created it manually.'
    );
  }
  return ok;
});

// 5. tables + demo data
run('npx', ['prisma', 'generate'], { cwd: path.join(ROOT, 'server') });
const migrated = once('migrate', 'database tables', () =>
  run('npx', ['prisma', 'migrate', 'deploy'], { cwd: path.join(ROOT, 'server') })
);
if (migrated) {
  once('seed', 'demo data', () => run('npm', ['run', 'db:seed'], { cwd: path.join(ROOT, 'server') }));
  console.log('\n=== Setup complete - starting the app ===\n');
} else {
  console.error(
    '\n[setup] Migration failed - the database isn\'t reachable yet (check server/.env and that ' +
      'the "mis" database exists). Fix it, then run:  node scripts/setup.mjs\n'
  );
  process.exit(1);
}
