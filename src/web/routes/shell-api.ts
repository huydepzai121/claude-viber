/**
 * Shell REST API routes — mirrors src/main/handlers/shell-handlers.ts.
 * In web mode, shell.openExternal is handled client-side via window.open.
 * This endpoint is a no-op that returns success.
 */
import { execFile } from 'child_process';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { existsSync, statSync } from 'fs';

const router = Router();

// POST /api/shell/open-external
// In web mode, the web bridge handles this via window.open — server just returns success
router.post('/open-external', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/shell/open-folder
// Opens a directory using the OS-native file manager
router.post('/open-folder', (req: Request, res: Response) => {
  const { folderPath } = req.body as { folderPath?: string };

  if (!folderPath || typeof folderPath !== 'string') {
    res.status(400).json({ success: false, error: 'folderPath is required' });
    return;
  }

  if (!existsSync(folderPath)) {
    res.status(400).json({ success: false, error: 'Path does not exist' });
    return;
  }

  try {
    const stat = statSync(folderPath);
    if (!stat.isDirectory()) {
      res.status(400).json({ success: false, error: 'Path is not a directory' });
      return;
    }
  } catch {
    res.status(400).json({ success: false, error: 'Failed to stat path' });
    return;
  }

  let cmd: string;
  if (process.platform === 'darwin') {
    cmd = 'open';
  } else if (process.platform === 'win32') {
    cmd = 'explorer';
  } else {
    cmd = 'xdg-open';
  }

  execFile(cmd, [folderPath], (error) => {
    if (error) {
      res.json({ success: false, error: error.message });
    } else {
      res.json({ success: true });
    }
  });
});

export default router;
