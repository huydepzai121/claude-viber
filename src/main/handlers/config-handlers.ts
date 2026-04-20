import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { homedir, release, type, version } from 'os';
import { join } from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';

import {
  addRecentFolder,
  buildClaudeSessionEnv,
  buildEnhancedPath,
  ensureWorkspaceDir,
  getApiBaseUrl,
  getApiKeyStatus,
  getDebugMode,
  getOnboardingState,
  getRecentFolders,
  getSidebarCollapsed,
  getUserProfile,
  getWorkspaceDir,
  loadConfig,
  saveConfig,
  setApiBaseUrl,
  setApiKey,
  setOnboardingDismissed,
  setOnboardingTaskCompleted,
  setSidebarCollapsed,
  setUserProfile
} from '../lib/config';

const requireModule = createRequire(import.meta.url);

function getClaudeAgentSdkVersion(): string {
  try {
    // Try to resolve the SDK package.json
    const sdkPackagePath = requireModule.resolve('@anthropic-ai/claude-agent-sdk/package.json');

    // Handle app.asar unpacked case (production builds)
    let packagePath = sdkPackagePath;
    if (sdkPackagePath.includes('app.asar')) {
      const unpackedPath = sdkPackagePath.replace('app.asar', 'app.asar.unpacked');
      if (existsSync(unpackedPath)) {
        packagePath = unpackedPath;
      }
    }

    if (existsSync(packagePath)) {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      return packageJson.version || 'unknown';
    }
  } catch {
    // Fallback if we can't read the version
  }
  return 'unknown';
}

export function registerConfigHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Get workspace directory
  ipcMain.handle('config:get-workspace-dir', () => {
    return { workspaceDir: getWorkspaceDir() };
  });

  // Set workspace directory
  ipcMain.handle('config:set-workspace-dir', async (_event, workspaceDir: string) => {
    const trimmedPath = workspaceDir.trim();
    if (!trimmedPath) {
      return { success: false, error: 'Workspace directory cannot be empty' };
    }

    const config = loadConfig();
    config.workspaceDir = trimmedPath;
    saveConfig(config);

    // Create the new workspace directory
    await ensureWorkspaceDir();

    // Broadcast to renderer so all pages stay in sync
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config:workspace-changed', { workspaceDir: trimmedPath });
    }

    return { success: true };
  });

  // Get debug mode
  ipcMain.handle('config:get-debug-mode', () => {
    return { debugMode: getDebugMode() };
  });

  // Set debug mode
  ipcMain.handle('config:set-debug-mode', (_event, debugMode: boolean) => {
    const config = loadConfig();
    config.debugMode = debugMode;
    saveConfig(config);
    return { success: true };
  });

  // API key status (env vs local config)
  ipcMain.handle('config:get-api-key-status', () => {
    return { status: getApiKeyStatus() };
  });

  // Set or clear API key stored in app config
  ipcMain.handle('config:set-api-key', (_event, apiKey?: string | null) => {
    const normalized = apiKey?.trim() || null;
    setApiKey(normalized);
    return { success: true, status: getApiKeyStatus() };
  });

  // Get API base URL
  ipcMain.handle('config:get-api-base-url', () => {
    return { apiBaseUrl: getApiBaseUrl() };
  });

  // Set or clear API base URL
  ipcMain.handle('config:set-api-base-url', (_event, apiBaseUrl?: string | null) => {
    const normalized = apiBaseUrl?.trim() || null;
    setApiBaseUrl(normalized);
    return { success: true };
  });

  // Get PATH environment variable info (for debug/dev section)
  // Uses the enhanced PATH (same as Claude Agent SDK) for consistency
  ipcMain.handle('config:get-path-info', () => {
    const pathSeparator = process.platform === 'win32' ? ';' : ':';
    // Use enhanced PATH to match what Claude Agent SDK uses
    const enhancedPath = buildEnhancedPath();
    const pathEntries = enhancedPath.split(pathSeparator).filter((p) => p.trim());
    return {
      platform: process.platform,
      pathSeparator,
      pathEntries,
      pathCount: pathEntries.length,
      fullPath: enhancedPath
    };
  });

  // Get all environment variables (for debug/dev section)
  // Uses the same environment object as Claude Agent SDK query sessions for consistency
  // Masks sensitive variables like API keys, passwords, tokens, etc.
  ipcMain.handle('config:get-env-vars', () => {
    const sensitivePatterns = [
      /KEY/i,
      /SECRET/i,
      /PASSWORD/i,
      /TOKEN/i,
      /AUTH/i,
      /CREDENTIAL/i,
      /PRIVATE/i
    ];

    const maskValue = (key: string, value: string): string => {
      // Check if key matches any sensitive pattern
      const isSensitive = sensitivePatterns.some((pattern) => pattern.test(key));
      if (!isSensitive) {
        return value;
      }

      // Mask sensitive values
      if (value.length <= 8) {
        return '****';
      }
      return '****';
    };

    // Use the same environment builder as Claude Agent SDK to ensure consistency
    const env = buildClaudeSessionEnv();

    const envVars: Array<{ key: string; value: string }> = [];
    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined) {
        envVars.push({
          key,
          value: maskValue(key, value)
        });
      }
    }

    // Sort alphabetically by key
    envVars.sort((a, b) => a.key.localeCompare(b.key));

    return { envVars, count: envVars.length };
  });

  // Get app diagnostic metadata (versions, platform info, etc.)
  ipcMain.handle('config:get-diagnostic-metadata', () => {
    return {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromiumVersion: process.versions.chrome,
      v8Version: process.versions.v8,
      nodeVersion: process.versions.node,
      claudeAgentSdkVersion: getClaudeAgentSdkVersion(),
      platform: process.platform,
      arch: process.arch,
      osRelease: release(),
      osType: type(),
      osVersion: version()
    };
  });

  // MCP Server Management — read/write ~/.claude/settings.json
  const claudeSettingsPath = join(homedir(), '.claude', 'settings.json');

  function readClaudeSettings(): Record<string, unknown> {
    try {
      if (existsSync(claudeSettingsPath)) {
        return JSON.parse(readFileSync(claudeSettingsPath, 'utf-8'));
      }
    } catch {
      // ignore
    }
    return {};
  }

  function writeClaudeSettings(settings: Record<string, unknown>): void {
    writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2));
  }

  ipcMain.handle('config:get-mcp-servers', () => {
    const settings = readClaudeSettings();
    const mcpServers = (settings.mcpServers ?? {}) as Record<string, unknown>;
    return { mcpServers };
  });

  ipcMain.handle('config:set-mcp-servers', (_event, mcpServers: Record<string, unknown>) => {
    const settings = readClaudeSettings();
    settings.mcpServers = mcpServers;
    writeClaudeSettings(settings);
    return { success: true };
  });

  // Read slash commands and skills from ~/.claude/ directory
  ipcMain.handle('config:get-claude-commands', () => {
    const claudeDir = join(homedir(), '.claude');
    const commands: { name: string; description: string; argumentHint: string }[] = [];

    // Read commands from ~/.claude/commands/
    const commandsDir = join(claudeDir, 'commands');
    if (existsSync(commandsDir)) {
      try {
        const entries = readdirSync(commandsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const name = entry.name.replace(/\.md$/, '');
            commands.push({ name: `/${name}`, description: '', argumentHint: '' });
          } else if (entry.isDirectory()) {
            // Sub-commands: ~/.claude/commands/ckm/*.md → /ckm:subname
            const subDir = join(commandsDir, entry.name);
            try {
              const subEntries = readdirSync(subDir, { withFileTypes: true });
              for (const subEntry of subEntries) {
                if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
                  const subName = subEntry.name.replace(/\.md$/, '');
                  commands.push({
                    name: `/${entry.name}:${subName}`,
                    description: '',
                    argumentHint: ''
                  });
                }
              }
            } catch {
              // skip unreadable subdirectories
            }
          }
        }
      } catch {
        // ignore read errors
      }
    }

    // Read skills from ~/.claude/skills/ (directory names)
    const skillsDir = join(claudeDir, 'skills');
    if (existsSync(skillsDir)) {
      try {
        const entries = readdirSync(skillsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            // Skills are available as slash commands too
            const skillName = entry.name;
            // Don't add if already in commands list
            if (!commands.some((c) => c.name === `/${skillName}`)) {
              commands.push({ name: `/${skillName}`, description: 'Skill', argumentHint: '' });
            }
          }
        }
      } catch {
        // ignore read errors
      }
    }

    // Sort alphabetically
    commands.sort((a, b) => a.name.localeCompare(b.name));

    return { commands };
  });

  // Native folder picker dialog
  ipcMain.handle('config:browse-folder', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      const allWindows = BrowserWindow.getAllWindows();
      const parentWindow = focusedWindow ?? (allWindows.length > 0 ? allWindows[0] : null);
      const result = await dialog.showOpenDialog(parentWindow as BrowserWindow, {
        properties: ['openDirectory'],
        title: 'Select workspace folder'
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, folder: null };
      }
      return { canceled: false, folder: result.filePaths[0] };
    } catch (error) {
      console.error('Failed to open folder picker:', error);
      return { canceled: true, folder: null };
    }
  });

  // Recent folders
  ipcMain.handle('config:get-recent-folders', () => {
    return { folders: getRecentFolders() };
  });

  ipcMain.handle('config:add-recent-folder', (_event, folder: string) => {
    addRecentFolder(folder);
    return { success: true };
  });

  // User profile
  ipcMain.handle('config:get-user-profile', () => {
    return { profile: getUserProfile() };
  });

  ipcMain.handle('config:set-user-profile', (_event, profile: { name: string; plan: string }) => {
    setUserProfile(profile);
    return { success: true };
  });

  // Onboarding state
  ipcMain.handle('config:get-onboarding-state', () => {
    return getOnboardingState();
  });

  ipcMain.handle('config:set-onboarding-dismissed', (_event, dismissed: boolean) => {
    setOnboardingDismissed(dismissed);
    return { success: true };
  });

  ipcMain.handle(
    'config:set-onboarding-task-completed',
    (_event, taskId: string, completed: boolean) => {
      setOnboardingTaskCompleted(taskId, completed);
      return { success: true };
    }
  );

  // Sidebar state
  ipcMain.handle('config:get-sidebar-collapsed', () => {
    return { collapsed: getSidebarCollapsed() };
  });

  ipcMain.handle('config:set-sidebar-collapsed', (_event, collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    return { success: true };
  });

  // Skill discovery — read SKILL.md frontmatter from workspace skills
  ipcMain.handle('config:get-skills', () => {
    const skillsDir = join(getWorkspaceDir(), '.claude', 'skills');
    const skills: { name: string; description: string; path: string }[] = [];

    if (!existsSync(skillsDir)) {
      return { skills };
    }

    try {
      const entries = readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

        const skillPath = join(skillsDir, entry.name);
        const skillMdPath = join(skillPath, 'SKILL.md');

        let name = entry.name;
        let description = '';

        if (existsSync(skillMdPath)) {
          try {
            const content = readFileSync(skillMdPath, 'utf-8');
            // Parse YAML frontmatter between --- delimiters
            const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
            if (match) {
              const frontmatter = match[1];
              const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
              const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
              if (nameMatch) name = nameMatch[1].trim();
              if (descMatch) description = descMatch[1].trim();
            }
          } catch {
            // skip unreadable SKILL.md
          }
        }

        skills.push({ name, description, path: skillPath });
      }
    } catch {
      // ignore read errors
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));
    return { skills };
  });
}
