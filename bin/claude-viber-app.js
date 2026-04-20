#!/usr/bin/env node

/**
 * CLI entry point for claude-viber desktop app.
 * Launches the Electron application.
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

console.log('Starting Claude Viber Desktop App...\n');

const electronPath = resolve(rootDir, 'node_modules', '.bin', 'electron');
const mainFile = resolve(rootDir, 'out', 'main', 'index.js');

const appProcess = spawn(electronPath, [mainFile], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env }
});

process.on('SIGINT', () => {
  appProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  appProcess.kill('SIGTERM');
  process.exit(0);
});

appProcess.on('close', (code) => {
  process.exit(code || 0);
});
