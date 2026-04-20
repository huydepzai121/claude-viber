## Why

The app currently only runs as an Electron desktop app. Adding a web server mode allows users to access the full chat interface via browser at `localhost:2810`, enabling headless/server deployments and easier development without Electron overhead.

## What Changes

- Add a Node.js Express + WebSocket server (`src/web/`) that mirrors all Electron IPC handlers as REST + WS endpoints
- Add a web bridge (`src/renderer/lib/web-bridge.ts`) that implements the full `window.electron` API using `fetch` and WebSocket
- Inject the web bridge at renderer startup when not running inside Electron
- Add `dev:web`, `build:web`, and `start:web` npm scripts
- Add a separate Vite config (`vite.web.config.ts`) for standalone web builds
- Electron mode remains fully functional and unchanged

## Capabilities

### New Capabilities

- `web-server`: Express server on port 2810 exposing REST API + WebSocket for all chat, config, file, conversation, and shell operations
- `web-bridge`: Client-side adapter implementing the full `window.electron` interface using HTTP/WebSocket instead of Electron IPC
- `web-scripts`: Build and dev scripts for running/building the web mode

### Modified Capabilities

<!-- No existing spec-level requirements are changing — Electron mode is untouched -->

## Impact

- **New files**: `src/web/server.ts`, `src/web/standalone-config.ts`, `src/web/standalone-conversation-db.ts`, `src/web/lib/web-session.ts`, `src/web/routes/*`, `src/renderer/lib/web-bridge.ts`, `vite.web.config.ts`
- **Modified files**: `src/renderer/main.tsx` (inject bridge), `src/renderer/index.html` (CSP), `src/renderer/components/FolderPicker.tsx` (text input fallback), Update components (graceful degradation), `package.json` (scripts + deps)
- **New deps**: `express`, `ws`, `http-proxy-middleware`, `concurrently`
- **No changes** to `src/main/` (Electron process untouched)
