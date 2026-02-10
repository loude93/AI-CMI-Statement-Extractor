import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const run = (name, command, args) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${name}] exited via signal ${signal}`);
    } else if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  return child;
};

let shuttingDown = false;
const children = [];

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 250);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

children.push(run('backend', process.execPath, ['backend/server.js']));
children.push(
  run('frontend', process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '0.0.0.0',
    '--port',
    '4173',
    '--strictPort'
  ])
);
