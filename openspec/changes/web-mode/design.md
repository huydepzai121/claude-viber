## Context

The project is an Electron desktop app (React + TypeScript) that wraps the Anthropic Claude Agent SDK. The renderer communicates with the main process via Electron IPC (`window.electron.*`). All business logic (chat streaming, config, file ops, conversations) lives in `src/main/handlers/` and `src/main/lib/`.

The goal is to add a web server mode that serves the same React UI via browser, replacing IPC with HTTP REST + WebSocket — without touching the Electron code path.

**Current architecture:**
```
Renderer (React) ←─ IPC ─→ Main Process (Electron)
window.electron.*           ├── chat-handlers.ts (claude-session.ts)
                            ├── config-handlers.ts (config.ts)
                            ├── conversation-handlers.ts (conversation-db.ts)
                            ├── file-handlers.ts
                            └── shell-handlers.ts
```

**Constraints:**
- `src/main/lib/config.ts` uses `app.getPath('userData')` and `app.getPath('desktop')` from Electron — cannot be imported in web server
- `src/main/lib/conversation-db.ts` uses `app.getPath('userData')` — same issue
- `claude-session.ts` calls `mainWindow.webContents.send(event, data)` to push events to renderer — needs abstraction
- CSP in `src/renderer/index.html` blocks WebSocket connections (needs `connect-src ws://`)

## Goals / Non-Goals

**Goals:**
- `bun run dev:web` starts everything and browser opens `localhost:2810`
- Full feature parity with Electron mode: chat streaming, settings, conversations, file attachments, MCP, skills, slash commands
- Electron mode continues to work exactly as before (zero changes to `src/main/`)
- WebSocket auto-reconnects with session resume on disconnect
- `browseFolder` falls back to text input in web mode (no native dialog)
- Update functionality no-ops gracefully in web mode

**Non-Goals:**
- Multi-user/multi-session web server (single local user only)
- HTTPS / authentication for the web server
- Docker / remote deployment
- Replacing Electron as the primary distribution method

## Decisions

### D1: Standalone lib copies instead of shared abstractions

**Decision**: Create `src/web/standalone-config.ts` and `src/web/standalone-conversation-db.ts` as copies of their Electron counterparts with `app.getPath()` calls replaced by hardcoded `~/.claude-agent-desktop/` paths.

**Alternatives considered**:
- Inject path resolver via dependency injection → adds abstraction complexity to all callers
- Use environment variables to switch paths → fragile, harder to type

**Rationale**: Copying ~150 lines each is cheaper than refactoring shared libs. The configs are stable and the duplication is isolated.

### D2: web-session.ts wraps claude-session.ts logic with callback abstraction

**Decision**: Extract the streaming loop from `claude-session.ts` into a shared helper, then `web-session.ts` passes a `sendEvent(type, data)` callback that writes to a WebSocket instead of `mainWindow.webContents.send`.

**Alternatives considered**:
- Copy the entire session file → large duplication, hard to keep in sync
- Refactor `claude-session.ts` to accept an injected sender → touches Electron code

**Rationale**: Minimal duplication. The streaming event logic is identical; only the delivery mechanism differs.

### D3: Web bridge mounts as window.electron before React renders

**Decision**: In `src/renderer/main.tsx`, detect `!(window as any).__ELECTRON__` (set by preload) and synchronously install `webBridge` onto `window.electron` before `ReactDOM.createRoot`. This means all renderer code that calls `window.electron.*` works unchanged.

**Alternatives considered**:
- React Context for the bridge → requires touching every component
- Conditional imports per component → invasive

**Rationale**: Zero renderer code changes. Bridge is a drop-in replacement for the preload's `contextBridge`.

### D4: WebSocket protocol — event-based JSON messages

**Decision**: Use a simple `{ type: string, ...data }` envelope over a single WebSocket connection.

Client → server (commands):
```
{ type: "send-message", payload: SendMessagePayload }
{ type: "stop-message" }
{ type: "reset-session", resumeSessionId?: string }
{ type: "set-model-preference", preference: ChatModelPreference }
{ type: "set-model-direct", modelId: string }
{ type: "answer-user-question", answers: Record<string, string[]> }
```

Server → client (events, mirrors existing IPC events 1:1):
```
{ type: "message-chunk", chunk: string }
{ type: "thinking-start", data: { index: number } }
{ type: "thinking-chunk", data: { index: number, delta: string } }
{ type: "message-complete" }
{ type: "message-stopped" }
{ type: "message-error", error: string }
{ type: "tool-use-start", tool: ToolUse }
{ type: "tool-input-delta", data: ToolInputDelta }
{ type: "content-block-stop", data: ContentBlockStop }
{ type: "tool-result-start", data: ToolResultStart }
{ type: "tool-result-complete", data: ToolResultComplete }
{ type: "session-updated", data: { sessionId: string, resumed: boolean } }
{ type: "session-init", data: SessionInitData }
{ type: "slash-commands", commands: SlashCommand[] }
{ type: "supported-models", models: ModelInfo[] }
{ type: "ask-user-question", data: { questions: unknown[] } }
{ type: "debug-message", message: string }
{ type: "navigate", view: string }
```

**Rationale**: 1:1 mapping with existing IPC events means the web bridge's `on*` handlers are trivial wrappers.

### D5: Dev mode — Vite runs separately, Express proxies it

**Decision**: In dev mode, Vite runs on `:5174` and Express on `:2810` proxies non-API requests to Vite via `http-proxy-middleware`. The browser hits only `:2810`.

**Alternatives considered**:
- Vite serves directly, Express as middleware → requires Vite plugin integration, more complex
- Single port with Vite plugin → tight coupling

**Rationale**: Clean separation. Prod mode serves `out/renderer/` static files from Express directly.

### D6: File serving for open-in-default-app

**Decision**: Add `GET /files?path=<encoded-path>` endpoint that reads and streams the file. The web bridge's `file.openInDefaultApp` calls `window.open('/files?path=...')`.

**Rationale**: No native `shell.openPath` available in web context. Browser's built-in file viewer handles most formats.

### D7: WebSocket auto-reconnect

**Decision**: Web bridge tracks `lastSessionId`. On disconnect, reconnects after 2s exponential backoff (max 30s). On reconnect, sends `reset-session` with `lastSessionId` to resume the conversation.

**Rationale**: Matches existing `resume` mechanism in the SDK. Transparent to the user if reconnect succeeds within the backoff window.

## Risks / Trade-offs

- **Risk**: Duplication of config/conversation-db logic drifts from Electron originals → **Mitigation**: Annotate both files with "Mirror of src/main/lib/X.ts — keep in sync" comment
- **Risk**: WebSocket message ordering during reconnect window → **Mitigation**: Server drops in-flight messages if WS client disconnects; client shows reconnecting state
- **Risk**: `concurrently` process orchestration on Windows → **Mitigation**: Use `concurrently` with `--kill-others-on-fail` flag; document bun run dev:web requirement
- **Risk**: CSP change accidentally relaxes security for Electron mode → **Mitigation**: Only modify CSP when `window.__ELECTRON__` is NOT set (injected as meta tag by web server, not present in Electron)

## Migration Plan

1. Install new deps: `express`, `ws`, `@types/ws`, `@types/express`, `http-proxy-middleware`, `concurrently`
2. Create `src/web/` directory tree
3. Create standalone libs, web-session, routes, server
4. Create `vite.web.config.ts`
5. Create web bridge, modify `main.tsx` and `FolderPicker.tsx`
6. Add scripts to `package.json`
7. Test: `bun run dev:web`, open browser, verify chat → settings → conversations flow

**Rollback**: All changes are additive. Removing `src/web/` and reverting `main.tsx` + `package.json` restores the original state.

## Open Questions

- None — all decisions made in exploration session.
