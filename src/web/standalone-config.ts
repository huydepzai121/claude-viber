/**
 * Standalone config for web server mode.
 * Mirror of src/main/lib/config.ts — keep in sync.
 * Differences: uses ~/.claude-agent-desktop/ instead of app.getPath('userData'),
 * and ~/Desktop instead of app.getPath('desktop'). No Electron imports.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join, resolve } from 'path';

import type { ChatModelPreference } from '../shared/types/ipc';

export interface AppConfig {
  workspaceDir?: string;
  debugMode?: boolean;
  chatModelPreference?: ChatModelPreference | 'smart';
  apiKey?: string;
  apiBaseUrl?: string;
  recentFolders?: string[];
  userProfile?: { name: string; plan: string };
  onboardingDismissed?: boolean;
  onboardingCompleted?: Record<string, boolean>;
  sidebarCollapsed?: boolean;
}

const DEFAULT_MODEL_PREFERENCE: ChatModelPreference = 'smart-sonnet';
const DEFAULT_SMART_MODEL: ChatModelPreference = 'smart-sonnet';

function normalizeChatModelPreference(
  preference?: ChatModelPreference | 'smart' | null
): ChatModelPreference {
  switch (preference) {
    case 'fast':
      return 'fast';
    case 'smart-opus':
      return 'smart-opus';
    case 'smart':
    case 'smart-sonnet':
      return DEFAULT_SMART_MODEL;
    default:
      return DEFAULT_MODEL_PREFERENCE;
  }
}

function getAppDataDir(): string {
  return join(homedir(), '.claude-agent-desktop');
}

function getConfigPath(): string {
  const dir = getAppDataDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, 'config.json');
}

export function loadConfig(): AppConfig {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return {};
}

export function saveConfig(config: AppConfig): void {
  try {
    writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

export function getApiKey(): string | null {
  const envApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envApiKey) {
    return envApiKey;
  }

  const storedApiKey = loadConfig().apiKey?.trim();
  return storedApiKey || null;
}

export function setApiKey(apiKey: string | null): void {
  const config = loadConfig();
  if (apiKey && apiKey.trim()) {
    config.apiKey = apiKey.trim();
  } else {
    delete config.apiKey;
  }
  saveConfig(config);
}

export function getApiBaseUrl(): string | null {
  const config = loadConfig();
  const url = config.apiBaseUrl?.trim();
  return url || null;
}

export function setApiBaseUrl(url: string | null): void {
  const config = loadConfig();
  if (url && url.trim()) {
    config.apiBaseUrl = url.trim();
  } else {
    delete config.apiBaseUrl;
  }
  saveConfig(config);
}

function getApiKeyLastFour(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  return '****';
}

export function getApiKeyStatus(): {
  configured: boolean;
  source: 'env' | 'local' | null;
  lastFour: string | null;
} {
  const envApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envApiKey) {
    return { configured: true, source: 'env', lastFour: getApiKeyLastFour(envApiKey) };
  }

  const storedApiKey = loadConfig().apiKey?.trim();
  if (storedApiKey) {
    return { configured: true, source: 'local', lastFour: getApiKeyLastFour(storedApiKey) };
  }

  return { configured: false, source: null, lastFour: null };
}

export function getWorkspaceDir(): string {
  const config = loadConfig();
  if (config.workspaceDir) {
    return config.workspaceDir;
  }
  // Default to Desktop/claude-agent
  return join(homedir(), 'Desktop', 'claude-agent');
}

export function getDebugMode(): boolean {
  const config = loadConfig();
  return config.debugMode ?? false;
}

export function getChatModelPreferenceSetting(): ChatModelPreference {
  const config = loadConfig();
  return normalizeChatModelPreference(config.chatModelPreference);
}

export function setChatModelPreferenceSetting(preference: ChatModelPreference): void {
  const config = loadConfig();
  config.chatModelPreference = normalizeChatModelPreference(preference);
  saveConfig(config);
}

export function getRecentFolders(): string[] {
  return loadConfig().recentFolders ?? [];
}

export function addRecentFolder(folder: string): void {
  const config = loadConfig();
  const recent = config.recentFolders ?? [];
  const filtered = recent.filter((f) => f !== folder);
  config.recentFolders = [folder, ...filtered].slice(0, 10);
  saveConfig(config);
}

export function getUserProfile(): { name: string; plan: string } {
  return loadConfig().userProfile ?? { name: 'User', plan: 'Pro plan' };
}

export function setUserProfile(profile: { name: string; plan: string }): void {
  const config = loadConfig();
  config.userProfile = profile;
  saveConfig(config);
}

export function getOnboardingState(): { dismissed: boolean; completed: Record<string, boolean> } {
  const config = loadConfig();
  return {
    dismissed: config.onboardingDismissed ?? false,
    completed: config.onboardingCompleted ?? {}
  };
}

export function setOnboardingDismissed(dismissed: boolean): void {
  const config = loadConfig();
  config.onboardingDismissed = dismissed;
  saveConfig(config);
}

export function setOnboardingTaskCompleted(taskId: string, completed: boolean): void {
  const config = loadConfig();
  if (!config.onboardingCompleted) config.onboardingCompleted = {};
  config.onboardingCompleted[taskId] = completed;
  saveConfig(config);
}

export function getSidebarCollapsed(): boolean {
  return loadConfig().sidebarCollapsed ?? false;
}

export function setSidebarCollapsed(collapsed: boolean): void {
  const config = loadConfig();
  config.sidebarCollapsed = collapsed;
  saveConfig(config);
}

/**
 * Builds the environment for Claude Agent SDK sessions (web mode).
 * Does not include Electron-specific paths (bundled bun/uv/git/msys2).
 */
export function buildClaudeSessionEnv(): Record<string, string> {
  const apiKey = getApiKey();

  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    PATH: process.env.PATH || ''
  };

  if (apiKey) {
    env.ANTHROPIC_API_KEY = apiKey;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    env.ANTHROPIC_BASE_URL = apiBaseUrl;
  }

  if (getDebugMode()) {
    env.DEBUG = '1';
  }

  return env;
}

export async function ensureWorkspaceDir(): Promise<void> {
  const workspaceDir = getWorkspaceDir();
  if (!existsSync(workspaceDir)) {
    await mkdir(workspaceDir, { recursive: true });
  }
}

// Stub functions for Electron-specific paths — not used in web mode
export function getBundledBunPath(): string {
  return resolve(process.env.PATH?.split(':').find((p) => existsSync(join(p, 'bun'))) || '', 'bun');
}

export function buildEnhancedPath(): string {
  return process.env.PATH || '';
}
