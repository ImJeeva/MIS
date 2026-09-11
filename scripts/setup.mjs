// One-time first-run setup: installs everything, creates the MySQL database,
// applies migrations, and loads demo data. Safe to re-run - it skips anything
// already done. Delete .mis-setup-complete at the repo root to force it again.
import { existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MARKER = path.join(ROOT, '.mis-setup-complete');

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT, ...opts });
  return r.status === 0;
}

if (existsSync(MARKER)) {
  console.log('[setup] already done - skipping. (Delete .mis-setup-complete to redo.)');
  process.exit(0);
}

console.log('=== MIS first-time setup - this can take a few minutes ===');

// 1. server/.env
const envPath = path.join(ROOT, 'server', '.env');
const envExample = path.join(ROOT, 'server', '.env.example');
if (!existsSync(envPath)) {
  copyFileSync(envExample, envPath);
  console.log('[setup] created server/.env (MySQL root/root default - edit it if yours differs)');
} else {
  console.log('[setup] server/.env already exists - leaving it alone');
}

// 2. npm installs
for (const dir of ['.', 'server', 'client']) {
  if (!existsSync(path.join(ROOT, dir, 'node_modules'))) {
    run('npm', ['install'], { cwd: path.join(ROOT, dir) });
  } else {
    console.log(`[setup] ${dir}/node_modules already present - skipping npm install`);
  }
}

// 3. Python deps for the AI service (heuristic libs + TensorFlow for the real model)
function findPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const r = spawnSync(cmd, ['--version'], { shell: true });
    if (r.status === 0) return cmd;
  }
  return null;
}
const py = findPython();
if (py) {
  run(py, ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt', '-r', 'requirements-ml.txt'], {
    cwd: path.join(ROOT, 'ai-service'),
  });
} else {
  console.warn('[setup] Python not found on PATH - install Python 3.10-3.12 and re-run.');
}

// 4. create the database (uses the mysql CLI; tries PATH, then the common Windows install path)
function tryCreateDb(mysqlCmd) {
  return run(mysqlCmd, [
    '-u', 'root', '-proot', '-e',
    '"CREATE DATABASE IF NOT EXISTS mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"',
  ]);
}
const dbReady =
  tryCreateDb('mysql') ||
  tryCreateDb('"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"');
if (!dbReady) {
  console.warn(
    '[setup] Could not auto-create the "mis" database (mysql CLI not found, or wrong ' +
      'credentials). Create it yourself:\n' +
      '  CREATE DATABASE mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n' +
      'then re-run this script.'
  );
}

// 5. tables + demo data
run('npx', ['prisma', 'generate'], { cwd: path.join(ROOT, 'server') });
const migrated = run('npx', ['prisma', 'migrate', 'deploy'], { cwd: path.join(ROOT, 'server') });
if (migrated) {
  run('npm', ['run', 'db:seed'], { cwd: path.join(ROOT, 'server') });
  writeFileSync(MARKER, new Date().toISOString());
  console.log('\n=== Setup complete - starting the app ===\n');
} else {
  console.error(
    '\n[setup] Migration failed - usually means the database isn\'t reachable yet.\n' +
      'Fix the database, then run:  node scripts/setup.mjs\n'
  );
  process.exit(1);
}
