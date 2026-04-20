/**
 * Config REST API routes — mirrors src/main/handlers/config-handlers.ts.
 * All IPC handlers mapped to REST endpoints under /api/config/.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { homedir, release, type, version } from 'os';
import { dirname, join } from 'path';
import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  addRecentFolder,
  buildClaudeSessionEnv,
  buildEnhancedPath,
  ensureWorkspaceDir,
  getApiBaseUrl,
  getApiKeyStatus,
  getChatModelPreferenceSetting,
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
  setChatModelPreferenceSetting,
  setOnboardingDismissed,
  setOnboardingTaskCompleted,
  setSidebarCollapsed,
  setUserProfile
} from '../standalone-config';

const requireModule = createRequire(import.meta.url);

function getClaudeAgentSdkVersion(): string {
  try {
    const sdkPackagePath = requireModule.resolve('@anthropic-ai/claude-agent-sdk/package.json');
    if (existsSync(sdkPackagePath)) {
      const packageJson = JSON.parse(readFileSync(sdkPackagePath, 'utf-8'));
      return packageJson.version || 'unknown';
    }
  } catch {
    // fallback
  }
  return 'unknown';
}

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

const router = Router();

// GET /api/config/model-preference
router.get('/model-preference', (_req: Request, res: Response) => {
  res.json({ preference: getChatModelPreferenceSetting() });
});

// POST /api/config/model-preference
router.post('/model-preference', (req: Request, res: Response) => {
  const { preference } = req.body as { preference: string };
  setChatModelPreferenceSetting(preference as Parameters<typeof setChatModelPreferenceSetting>[0]);
  res.json({ success: true, preference: getChatModelPreferenceSetting() });
});

// GET /api/config/workspace-dir
router.get('/workspace-dir', (_req: Request, res: Response) => {
  res.json({ workspaceDir: getWorkspaceDir() });
});

// POST /api/config/workspace-dir
router.post('/workspace-dir', async (req: Request, res: Response) => {
  const { workspaceDir } = req.body as { workspaceDir: string };
  const trimmedPath = workspaceDir?.trim();
  if (!trimmedPath) {
    res.json({ success: false, error: 'Workspace directory cannot be empty' });
    return;
  }
  const config = loadConfig();
  config.workspaceDir = trimmedPath;
  saveConfig(config);
  await ensureWorkspaceDir();
  res.json({ success: true });
});

// GET /api/config/debug-mode
router.get('/debug-mode', (_req: Request, res: Response) => {
  res.json({ debugMode: getDebugMode() });
});

// POST /api/config/debug-mode
router.post('/debug-mode', (req: Request, res: Response) => {
  const { debugMode } = req.body as { debugMode: boolean };
  const config = loadConfig();
  config.debugMode = debugMode;
  saveConfig(config);
  res.json({ success: true });
});

// GET /api/config/api-key-status
router.get('/api-key-status', (_req: Request, res: Response) => {
  res.json({ status: getApiKeyStatus() });
});

// POST /api/config/api-key
router.post('/api-key', (req: Request, res: Response) => {
  const { apiKey } = req.body as { apiKey?: string | null };
  const normalized = apiKey?.trim() || null;
  setApiKey(normalized);
  res.json({ success: true, status: getApiKeyStatus() });
});

// GET /api/config/api-base-url
router.get('/api-base-url', (_req: Request, res: Response) => {
  res.json({ apiBaseUrl: getApiBaseUrl() });
});

// POST /api/config/api-base-url
router.post('/api-base-url', (req: Request, res: Response) => {
  const { apiBaseUrl } = req.body as { apiBaseUrl?: string | null };
  const normalized = apiBaseUrl?.trim() || null;
  setApiBaseUrl(normalized);
  res.json({ success: true });
});

// GET /api/config/path-info
router.get('/path-info', (_req: Request, res: Response) => {
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const enhancedPath = buildEnhancedPath();
  const pathEntries = enhancedPath.split(pathSeparator).filter((p) => p.trim());
  res.json({
    platform: process.platform,
    pathSeparator,
    pathEntries,
    pathCount: pathEntries.length,
    fullPath: enhancedPath
  });
});

// GET /api/config/env-vars
router.get('/env-vars', (_req: Request, res: Response) => {
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
    const isSensitive = sensitivePatterns.some((pattern) => pattern.test(key));
    if (!isSensitive) return value;
    return '****';
  };

  const env = buildClaudeSessionEnv();
  const envVars: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      envVars.push({ key, value: maskValue(key, value) });
    }
  }
  envVars.sort((a, b) => a.key.localeCompare(b.key));
  res.json({ envVars, count: envVars.length });
});

// GET /api/config/diagnostic-metadata
router.get('/diagnostic-metadata', (_req: Request, res: Response) => {
  res.json({
    appVersion: '0.1.3',
    electronVersion: 'N/A (web mode)',
    chromiumVersion: 'N/A (web mode)',
    v8Version: process.versions.v8,
    nodeVersion: process.versions.node,
    claudeAgentSdkVersion: getClaudeAgentSdkVersion(),
    platform: process.platform,
    arch: process.arch,
    osRelease: release(),
    osType: type(),
    osVersion: version()
  });
});

// GET /api/config/mcp-servers
router.get('/mcp-servers', (_req: Request, res: Response) => {
  const settings = readClaudeSettings();
  const mcpServers = (settings.mcpServers ?? {}) as Record<string, unknown>;
  res.json({ mcpServers });
});

// POST /api/config/mcp-servers
router.post('/mcp-servers', (req: Request, res: Response) => {
  const { mcpServers } = req.body as { mcpServers: Record<string, unknown> };
  const settings = readClaudeSettings();
  settings.mcpServers = mcpServers;
  writeClaudeSettings(settings);
  res.json({ success: true });
});

// GET /api/config/claude-commands
router.get('/claude-commands', (_req: Request, res: Response) => {
  const claudeDir = join(homedir(), '.claude');
  const commands: { name: string; description: string; argumentHint: string }[] = [];

  const commandsDir = join(claudeDir, 'commands');
  if (existsSync(commandsDir)) {
    try {
      const entries = readdirSync(commandsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const name = entry.name.replace(/\.md$/, '');
          commands.push({ name: `/${name}`, description: '', argumentHint: '' });
        } else if (entry.isDirectory()) {
          const subDir = join(commandsDir, entry.name);
          try {
            const subEntries = readdirSync(subDir, { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
                const subName = subEntry.name.replace(/\.md$/, '');
                commands.push({ name: `/${entry.name}:${subName}`, description: '', argumentHint: '' });
              }
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const skillsDir = join(claudeDir, 'skills');
  if (existsSync(skillsDir)) {
    try {
      const entries = readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const skillName = entry.name;
          if (!commands.some((c) => c.name === `/${skillName}`)) {
            commands.push({ name: `/${skillName}`, description: 'Skill', argumentHint: '' });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  commands.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ commands });
});

// POST /api/config/browse-folder
// In web mode, always returns canceled=true — renderer will show directory browser
router.post('/browse-folder', (_req: Request, res: Response) => {
  res.json({ canceled: true, folder: null });
});

// POST /api/config/list-directories
// Lists subdirectories of a given path for the directory browser
router.post('/list-directories', (req: Request, res: Response) => {
  const { path: dirPath } = req.body as { path?: string };

  // Default to home directory if no path provided
  const targetPath = dirPath?.trim() || homedir();

  if (!existsSync(targetPath)) {
    res.json({ directories: [], parentPath: null, error: 'Path does not exist' });
    return;
  }

  try {
    const stat = statSync(targetPath);
    if (!stat.isDirectory()) {
      res.json({ directories: [], parentPath: null, error: 'Path is not a directory' });
      return;
    }

    const entries = readdirSync(targetPath, { withFileTypes: true });
    const directories = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();

    // Calculate parent path
    const parentPath = dirname(targetPath);
    const hasParent = parentPath !== targetPath; // root has no parent

    res.json({
      currentPath: targetPath,
      directories,
      parentPath: hasParent ? parentPath : null,
      error: null
    });
  } catch (error) {
    res.json({ directories: [], parentPath: null, error: String(error) });
  }
});

// GET /api/config/recent-folders
router.get('/recent-folders', (_req: Request, res: Response) => {
  res.json({ folders: getRecentFolders() });
});

// POST /api/config/recent-folders
router.post('/recent-folders', (req: Request, res: Response) => {
  const { folder } = req.body as { folder: string };
  addRecentFolder(folder);
  res.json({ success: true });
});

// GET /api/config/user-profile
router.get('/user-profile', (_req: Request, res: Response) => {
  res.json({ profile: getUserProfile() });
});

// POST /api/config/user-profile
router.post('/user-profile', (req: Request, res: Response) => {
  const { profile } = req.body as { profile: { name: string; plan: string } };
  setUserProfile(profile);
  res.json({ success: true });
});

// GET /api/config/onboarding-state
router.get('/onboarding-state', (_req: Request, res: Response) => {
  res.json(getOnboardingState());
});

// POST /api/config/onboarding-dismissed
router.post('/onboarding-dismissed', (req: Request, res: Response) => {
  const { dismissed } = req.body as { dismissed: boolean };
  setOnboardingDismissed(dismissed);
  res.json({ success: true });
});

// POST /api/config/onboarding-task-completed
router.post('/onboarding-task-completed', (req: Request, res: Response) => {
  const { taskId, completed } = req.body as { taskId: string; completed: boolean };
  setOnboardingTaskCompleted(taskId, completed);
  res.json({ success: true });
});

// GET /api/config/sidebar-collapsed
router.get('/sidebar-collapsed', (_req: Request, res: Response) => {
  res.json({ collapsed: getSidebarCollapsed() });
});

// POST /api/config/sidebar-collapsed
router.post('/sidebar-collapsed', (req: Request, res: Response) => {
  const { collapsed } = req.body as { collapsed: boolean };
  setSidebarCollapsed(collapsed);
  res.json({ success: true });
});

// GET /api/config/skills
router.get('/skills', (_req: Request, res: Response) => {
  const skillsDir = join(getWorkspaceDir(), '.claude', 'skills');
  const skills: { name: string; description: string; path: string }[] = [];

  if (!existsSync(skillsDir)) {
    res.json({ skills });
    return;
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
          const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
          if (match) {
            const frontmatter = match[1];
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
          }
        } catch {
          // skip
        }
      }

      skills.push({ name, description, path: skillPath });
    }
  } catch {
    // ignore
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ skills });
});

export default router;
