import { execFile } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';
import { promisify } from 'util';
import { ipcMain, shell } from 'electron';

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

// PLACEHOLDER_MORE_HANDLERS

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

export function registerFileHandlers(): void {
  // Read text file
  ipcMain.handle('file:read-text', (_event, filePath: string) => {
    try {
      if (!existsSync(filePath)) {
        return { content: null, error: 'File not found' };
      }
      const content = readFileSync(filePath, 'utf-8');
      return { content, error: null };
    } catch (error) {
      return { content: null, error: String(error) };
    }
  });

  // Read binary file as base64
  ipcMain.handle('file:read-binary-base64', (_event, filePath: string) => {
    try {
      if (!existsSync(filePath)) {
        return { data: null, error: 'File not found' };
      }
      const buffer = readFileSync(filePath);
      const ext = extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      return { data: buffer.toString('base64'), mimeType, error: null };
    } catch (error) {
      return { data: null, mimeType: null, error: String(error) };
    }
  });

  // Get file info
  ipcMain.handle('file:get-info', (_event, filePath: string) => {
    try {
      const exists = existsSync(filePath);
      if (!exists) {
        return { exists: false, size: 0, extension: '', mimeType: '' };
      }
      const stats = statSync(filePath);
      const ext = extname(filePath).toLowerCase();
      return {
        exists: true,
        size: stats.size,
        extension: ext,
        mimeType: MIME_TYPES[ext] || 'application/octet-stream'
      };
    } catch {
      return { exists: false, size: 0, extension: '', mimeType: '' };
    }
  });

  // Open file in default OS app
  ipcMain.handle('file:open-in-default-app', async (_event, filePath: string) => {
    try {
      const result = await shell.openPath(filePath);
      return { success: !result, error: result || null };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Convert PPTX/PDF to images via libreoffice + pdftoppm
  ipcMain.handle('file:convert-to-images', async (_event, filePath: string) => {
    const ext = extname(filePath).toLowerCase();
    const tmpDir = join(tmpdir(), `claude-preview-${Date.now()}`);

    try {
      await mkdir(tmpDir, { recursive: true });

      let pdfPath = filePath;

      // Step 1: Convert PPTX to PDF if needed
      if (ext === '.pptx' || ext === '.pptm') {
        const libreoffice = (await findBinary('libreoffice')) ?? (await findBinary('soffice'));
        if (!libreoffice) {
          return { pages: [], error: 'libreoffice_not_found' };
        }
        try {
          await execFileAsync(
            libreoffice,
            ['--headless', '--convert-to', 'pdf', '--outdir', tmpDir, filePath],
            { timeout: 30000 }
          );
        } catch {
          return { pages: [], error: 'conversion_failed' };
        }
        const pdfName = basename(filePath).replace(/\.[^.]+$/, '.pdf');
        pdfPath = join(tmpDir, pdfName);
        if (!existsSync(pdfPath)) {
          return { pages: [], error: 'conversion_failed' };
        }
      }

      // Step 2: Convert PDF to images
      const pdftoppm = await findBinary('pdftoppm');
      if (!pdftoppm) {
        // Fallback: return PDF as single base64 page
        const pdfBuffer = readFileSync(pdfPath);
        return {
          pages: [{ data: pdfBuffer.toString('base64'), mimeType: 'application/pdf' }],
          error: null
        };
      }

      const pagePrefix = join(tmpDir, 'page');
      try {
        await execFileAsync(pdftoppm, ['-jpeg', '-r', '150', pdfPath, pagePrefix], {
          timeout: 60000
        });
      } catch {
        // Fallback to PDF
        const pdfBuffer = readFileSync(pdfPath);
        return {
          pages: [{ data: pdfBuffer.toString('base64'), mimeType: 'application/pdf' }],
          error: null
        };
      }

      // Read generated page images
      const pageFiles = readdirSync(tmpDir)
        .filter((f) => f.startsWith('page-') && f.endsWith('.jpg'))
        .sort();

      const pages = pageFiles.map((f) => ({
        data: readFileSync(join(tmpDir, f)).toString('base64'),
        mimeType: 'image/jpeg'
      }));

      return { pages, error: null };
    } catch (error) {
      return { pages: [], error: String(error) };
    } finally {
      // Cleanup temp dir
      rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });
}
