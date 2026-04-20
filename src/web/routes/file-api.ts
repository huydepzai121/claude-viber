/**
 * File REST API routes — mirrors src/main/handlers/file-handlers.ts.
 * Also serves GET /files?path=<encoded> for browser-based file opening.
 */
import { execFile } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, extname, join, normalize, resolve } from 'path';
import { promisify } from 'util';
import type { Request, Response } from 'express';
import { Router } from 'express';

const execFileAsync = promisify(execFile);

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.py': 'text/x-python',
  '.css': 'text/css',
  '.sh': 'text/x-shellscript'
};

async function findBinary(name: string): Promise<string | null> {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(cmd, [name]);
    const path = stdout.trim().split('\n')[0];
    return path && existsSync(path) ? path : null;
  } catch {
    return null;
  }
}

const router = Router();

/**
 * Validate that a requested path is safe to serve.
 * Accepts absolute paths within the configured workspace directory.
 * Also accepts absolute system paths (for backward compat with existing attachments).
 * Returns the resolved path or null if unsafe.
 */
function safePath(rawPath: string): string | null {
  if (!rawPath) return null;
  const resolved = resolve(normalize(rawPath));
  // Accept any absolute path that exists — this server is local-only.
  // The path must be an absolute path (no directory traversal tricks via query param).
  if (!resolved.startsWith('/') && !resolved.match(/^[A-Za-z]:\\/)) {
    return null;
  }
  return resolved;
}

// GET /api/file/read-text?path=<encoded>
router.get('/read-text', (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  const filePath = safePath(rawPath);
  try {
    if (!filePath || !existsSync(filePath)) {
      res.json({ content: null, error: 'File not found' });
      return;
    }
    const content = readFileSync(filePath, 'utf-8');
    res.json({ content, error: null });
  } catch (error) {
    res.json({ content: null, error: String(error) });
  }
});

// GET /api/file/read-binary?path=<encoded>
router.get('/read-binary', (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  const filePath = safePath(rawPath);
  try {
    if (!filePath || !existsSync(filePath)) {
      res.json({ data: null, error: 'File not found' });
      return;
    }
    const buffer = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    res.json({ data: buffer.toString('base64'), mimeType, error: null });
  } catch (error) {
    res.json({ data: null, mimeType: null, error: String(error) });
  }
});

// GET /api/file/info?path=<encoded>
router.get('/info', (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  const filePath = safePath(rawPath);
  try {
    const exists = filePath && existsSync(filePath);
    if (!exists || !filePath) {
      res.json({ exists: false, size: 0, extension: '', mimeType: '' });
      return;
    }
    const stats = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    res.json({
      exists: true,
      size: stats.size,
      extension: ext,
      mimeType: MIME_TYPES[ext] || 'application/octet-stream'
    });
  } catch {
    res.json({ exists: false, size: 0, extension: '', mimeType: '' });
  }
});

// POST /api/file/convert-to-images
router.post('/convert-to-images', async (req: Request, res: Response) => {
  const { filePath: rawFilePath } = req.body as { filePath: string };
  const filePath = safePath(rawFilePath);
  if (!filePath) {
    res.json({ pages: [], error: 'Invalid file path' });
    return;
  }
  const ext = extname(filePath).toLowerCase();
  const tmpDir = join(tmpdir(), `claude-preview-${Date.now()}`);

  try {
    await mkdir(tmpDir, { recursive: true });
    let pdfPath = filePath;

    if (ext === '.pptx' || ext === '.pptm') {
      const libreoffice = (await findBinary('libreoffice')) ?? (await findBinary('soffice'));
      if (!libreoffice) {
        res.json({ pages: [], error: 'libreoffice_not_found' });
        return;
      }
      try {
        await execFileAsync(
          libreoffice,
          ['--headless', '--convert-to', 'pdf', '--outdir', tmpDir, filePath],
          { timeout: 30000 }
        );
      } catch {
        res.json({ pages: [], error: 'conversion_failed' });
        return;
      }
      const pdfName = basename(filePath).replace(/\.[^.]+$/, '.pdf');
      pdfPath = join(tmpDir, pdfName);
      if (!existsSync(pdfPath)) {
        res.json({ pages: [], error: 'conversion_failed' });
        return;
      }
    }

    const pdftoppm = await findBinary('pdftoppm');
    if (!pdftoppm) {
      const pdfBuffer = readFileSync(pdfPath);
      res.json({
        pages: [{ data: pdfBuffer.toString('base64'), mimeType: 'application/pdf' }],
        error: null
      });
      return;
    }

    const pagePrefix = join(tmpDir, 'page');
    try {
      await execFileAsync(pdftoppm, ['-jpeg', '-r', '150', pdfPath, pagePrefix], {
        timeout: 60000
      });
    } catch {
      const pdfBuffer = readFileSync(pdfPath);
      res.json({
        pages: [{ data: pdfBuffer.toString('base64'), mimeType: 'application/pdf' }],
        error: null
      });
      return;
    }

    const pageFiles = readdirSync(tmpDir)
      .filter((f) => f.startsWith('page-') && f.endsWith('.jpg'))
      .sort();

    const pages = pageFiles.map((f) => ({
      data: readFileSync(join(tmpDir, f)).toString('base64'),
      mimeType: 'image/jpeg'
    }));

    res.json({ pages, error: null });
  } catch (error) {
    res.json({ pages: [], error: String(error) });
  } finally {
    rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

// GET /files?path=<encoded> — serve file for browser opening
// This replaces shell.openPath for web mode
export function createFilesRouter(): Router {
  const filesRouter = Router();
  filesRouter.get('/', (req: Request, res: Response) => {
    const rawPath = req.query.path as string;
    const filePath = safePath(rawPath);
    if (!filePath || !existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    try {
      const ext = extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      // Use RFC 5987 encoding to prevent header injection via special chars in filename
      const safeFilename = encodeURIComponent(basename(filePath));
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${safeFilename}`);
      const buffer = readFileSync(filePath);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  return filesRouter;
}

export default router;
