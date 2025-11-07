#!/usr/bin/env node

/**
 * Wrapper for running Steiger with a safer watcher configuration.
 * Falls back to polling mode to avoid exhausting file descriptors.
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);

const steigerBin = (() => {
  const binPrefix = path.resolve(__dirname, '../node_modules/.bin/steiger');
  const candidate = process.platform === 'win32' ? `${binPrefix}.cmd` : binPrefix;
  return candidate;
})();

const child = spawn(
  steigerBin,
  args.length > 0 ? args : ['src'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CHOKIDAR_USEPOLLING: '1',
      CHOKIDAR_INTERVAL: process.env.CHOKIDAR_INTERVAL ?? '200',
    },
    cwd: path.resolve(process.cwd()),
    shell: process.platform === 'win32',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
