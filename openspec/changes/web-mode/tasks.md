## 1. Dependencies & Config

- [x] 1.1 Add `express`, `ws`, `@types/ws`, `@types/express`, `http-proxy-middleware`, `concurrently` to devDependencies in package.json
- [x] 1.2 Add `dev:web`, `build:web`, and `start:web` scripts to package.json
- [x] 1.3 Create `vite.web.config.ts` with React + Tailwind plugins, root=`src/renderer`, outDir=`out/renderer`, `@` alias

## 2. Standalone Backend Libs (no Electron deps)

- [x] 2.1 Create `src/web/standalone-config.ts` — copy config.ts logic, replace `app.getPath('userData')` with `~/.claude-agent-desktop/`, `app.getPath('desktop')` with `~/Desktop`; remove all `electron` imports
- [x] 2.2 Create `src/web/standalone-conversation-db.ts` — copy conversation-db.ts logic, replace `app.getPath('userData')` with `~/.claude-agent-desktop/conversations/`; remove all `electron` imports ← (verify: both files compile without Electron imports, paths resolve correctly)

## 3. Web Session (WebSocket-based streaming)

- [x] 3.1 Create `src/web/lib/web-session.ts` — adapt claude-session.ts: replace `mainWindow.webContents.send(event, data)` with a `sendEvent(type, data)` callback parameter; replace `ipcMain.handleOnce('chat:answer-user-question', handler)` with a Promise-based `waitForUserAnswer` callback
- [x] 3.2 Ensure `web-session.ts` imports from `./standalone-config.ts` instead of `../lib/config.ts` ← (verify: streaming events emitted correctly via callback; session abort/reset/resume logic matches claude-session.ts)

## 4. Express Routes

- [x] 4.1 Create `src/web/routes/chat-ws.ts` — WebSocket upgrade handler: parse incoming command messages, call web-session functions, wire `sendEvent` callback to write WS messages back to client
- [x] 4.2 Create `src/web/routes/config-api.ts` — Express router mirroring all 18 config IPC handlers as REST endpoints; `browseFolder` returns `{ canceled: true, folder: null }`; `getDiagnosticMetadata` returns web-appropriate versions (no `electronVersion`, `chromiumVersion`)
- [x] 4.3 Create `src/web/routes/conversation-api.ts` — Express router mirroring 5 conversation handlers (list, create, get, update, delete); use `standalone-conversation-db.ts`
- [x] 4.4 Create `src/web/routes/file-api.ts` — Express router for file operations (read-text, read-binary-base64, get-info, convert-to-images) plus `GET /files` endpoint that streams file content by encoded path ← (verify: all file routes return correct shape matching electron.d.ts types)
- [x] 4.5 Create `src/web/routes/shell-api.ts` — `POST /api/shell/open-external` returns `{ success: true }` (browser handles external links via web bridge's `window.open`)

## 5. Web Server Entry Point

- [x] 5.1 Create `src/web/server.ts` — Express app on port 2810: mount all route files under `/api/*`, handle WebSocket upgrade at `/ws`, serve `GET /files`, in dev mode proxy all other requests to `http://localhost:5174` via `http-proxy-middleware`, in prod mode serve `out/renderer/` static files ← (verify: server starts on 2810, proxies non-API to Vite in dev, serves static in prod)

## 6. Web Bridge (Renderer)

- [x] 6.1 Create `src/renderer/lib/web-bridge.ts` — implement full `ElectronAPI` interface: `chat.*` methods use WebSocket (single connection to `ws://localhost:2810/ws`), all `config.*` and `conversation.*` and `file.*` and `shell.*` methods use `fetch('/api/...')`, `update.*` methods are graceful no-ops, `onNavigate` is a no-op subscriber
- [x] 6.2 Implement WebSocket reconnect logic in web-bridge: track `lastSessionId` from `session-updated` events; on disconnect, retry with exponential backoff (2s → 4s → 8s, max 30s); on reconnect send `{ type: "reset-session", resumeSessionId: lastSessionId }` ← (verify: all ElectronAPI methods present and correctly typed; reconnect logic triggers on WS close event)

## 7. Renderer Integration

- [x] 7.1 Modify `src/renderer/main.tsx`: before `ReactDOM.createRoot`, check `!(window as any).__ELECTRON__`; if true, dynamically import `./lib/web-bridge` and call `installWebBridge()` which sets `window.electron = webBridgeImpl`
- [x] 7.2 Modify `src/renderer/index.html`: update CSP `connect-src` to allow `ws://localhost:2810` (add alongside existing `'self'`)
- [x] 7.3 Modify `src/renderer/components/FolderPicker.tsx` (or equivalent browse-folder UI): when `browseFolder()` returns `{ canceled: true }`, show text input for manual path entry instead of treating it as a cancelled dialog
- [x] 7.4 Guard Update components: wrap `window.electron.update.*` event subscriptions in `UpdateNotification.tsx`, `UpdateReadyBanner.tsx`, `UpdateCheckFeedback.tsx` with existence checks so they silently no-op when update returns idle state ← (verify: app loads in browser without JS errors; Settings page renders; FolderPicker shows text input in web mode)

## 8. Preload: Set Electron Flag

- [x] 8.1 Add `(window as any).__ELECTRON__ = true` at the top of `src/preload/index.ts` before the `contextBridge.exposeInMainWorld` call so the renderer can detect Electron mode ← (verify: Electron app still works; browser detects web mode correctly)

## 9. Validation

- [x] 9.1 Run `bun run typecheck` — fix any TypeScript errors
- [x] 9.2 Run `bun run lint` — fix any lint errors
- [ ] 9.3 Manual smoke test: run `bun run dev:web`, open browser at `http://localhost:2810`, verify chat sends a message and streams response
- [ ] 9.4 Manual smoke test: verify Settings page loads, API key can be entered, workspace dir text input appears for Browse Folder ← (verify: full chat flow works end-to-end in browser; Settings saves config; Electron mode still works via `bun run dev`)
