#!/usr/bin/env node

/**
 * CLI entry point for claude-viber.
 * Starts the web server and opens the browser.
 */

import { spawn, exec } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Detect platform for opening browser
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === 'darwin') {
    cmd = 'open';
  } else if (platform === 'win32') {
    cmd = 'start';
  } else {
    cmd = 'xdg-open';
  }

  exec(`${cmd} ${url}`, (error) => {
    if (error) {
      console.log(`\nOpen in browser: ${url}\n`);
    }
  });
}

// Start the web server
console.log('Starting Claude Viber...\n');

const serverProcess = spawn('bun', ['src/web/server.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, WEB_PROD: '1' }
});

// Wait a moment for server to start, then open browser
setTimeout(() => {
  openBrowser('http://localhost:7567');
}, 1500);

// Handle process exit
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('close', (code) => {
  process.exit(code || 0);
});
