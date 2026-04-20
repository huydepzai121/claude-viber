#!/usr/bin/env node

/**
 * CLI entry point for claude-viber desktop app.
 * Launches the Electron application via npx.
 */

import { execSync, spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const mainFile = resolve(rootDir, 'out', 'main', 'index.js');

if (!existsSync(mainFile)) {
  console.error('Error: Built app not found. Run from the claude-viber package directory.');
  process.exit(1);
}

// Find electron: local node_modules first, then global npx
let electronBin = resolve(rootDir, 'node_modules', '.bin', 'electron');
if (!existsSync(electronBin)) {
  // Try to find electron globally
  try {
    electronBin = execSync('which electron 2>/dev/null || where electron 2>nul', {
      encoding: 'utf-8'
    }).trim();
  } catch {
    // Fall back to npx
    console.log('Electron not found locally. Installing via npx...\n');
    const appProcess = spawn('npx', ['electron', mainFile], {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env }
    });
    appProcess.on('close', (code) => process.exit(code || 0));
    process.on('SIGINT', () => { appProcess.kill('SIGINT'); process.exit(0); });
    process.on('SIGTERM', () => { appProcess.kill('SIGTERM'); process.exit(0); });
    // Early return — npx handles everything
    electronBin = null;
  }
}

if (electronBin) {
  console.log('Starting Claude Viber Desktop App...\n');
  const appProcess = spawn(electronBin, [mainFile], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env }
  });
  process.on('SIGINT', () => { appProcess.kill('SIGINT'); process.exit(0); });
  process.on('SIGTERM', () => { appProcess.kill('SIGTERM'); process.exit(0); });
  appProcess.on('close', (code) => process.exit(code || 0));
}
