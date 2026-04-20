/**
 * Web server entry point — Express on port 2810.
 * Dev mode: proxies non-API requests to Vite on :5174
 * Prod mode: serves out/renderer/ static files
 */
import { createServer } from 'http';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { setupChatWebSocket } from './routes/chat-ws';
import configRouter from './routes/config-api';
import conversationRouter from './routes/conversation-api';
import fileRouter, { createFilesRouter } from './routes/file-api';
import shellRouter from './routes/shell-api';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 7567;
const VITE_PORT = 7568;
const isDev = process.env.NODE_ENV !== 'production' && !process.env.WEB_PROD;

const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic CORS protection: only allow requests from same origin (localhost:2810)
// This prevents cross-origin web pages from reading local files via the file API
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  // Allow requests with no origin (direct API calls, curl, etc.)
  // Only block cross-origin requests from other hosts
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    res.status(403).json({ error: 'Cross-origin requests not allowed' });
    return;
  }
  if (referer && !referer.includes('localhost') && !referer.includes('127.0.0.1')) {
    res.status(403).json({ error: 'Cross-origin requests not allowed' });
    return;
  }
  // Set CORS headers for allowed origins
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

// Mount API routes
app.use('/api/config', configRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/file', fileRouter);
app.use('/api/shell', shellRouter);

// Serve files for browser opening (replaces shell.openPath)
app.use('/files', createFilesRouter());

if (isDev) {
  // In dev mode, proxy all non-API requests to Vite dev server
  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${VITE_PORT}`,
      changeOrigin: true,
      ws: false, // WS is handled separately at /ws
      on: {
        error: (_err, _req, res) => {
          if ('writeHead' in res) {
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end(`Vite dev server not running on port ${VITE_PORT}. Start it first.`);
          }
        }
      }
    })
  );
} else {
  // In production, serve the built renderer files
  const rendererDir = resolve(__dirname, '../../out/renderer');
  app.use(express.static(rendererDir));
  // Fallback to index.html for SPA routing
  app.use((_req, res) => {
    res.sendFile(join(rendererDir, 'index.html'));
  });
}

// Setup WebSocket for chat at /ws
setupChatWebSocket(server);

server.listen(PORT, () => {
  console.log(`\n🌐 Web server running at http://localhost:${PORT}`);
  if (isDev) {
    console.log(`   Proxying UI to Vite on port ${VITE_PORT}`);
    console.log(`   Make sure to also run: vite --config vite.web.config.ts`);
  }
  console.log(`   WebSocket chat at ws://localhost:${PORT}/ws\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the existing server and try again.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
