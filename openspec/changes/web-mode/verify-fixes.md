## 2026-04-12 Round 3 (from spx-verify + spx-apply)

### spx-verifier

- Fixed: C1 — API key check in chat-ws.ts send-message handler replaced `process.env.ANTHROPIC_API_KEY || ''` with `getApiKey()` from standalone-config; added `getApiKey` to import
- Fixed: C2 — Duplicate AskUserQuestion event: removed `sendEvent('ask-user-question', { questions })` from web-session.ts:206 (the call before `waitForAnswer`); waitForAnswer in chat-ws.ts already sends the event
- Fixed: C3 — convert-to-images in file-api.ts now calls `safePath(rawFilePath)` before using filePath in execFileAsync; returns `{ pages: [], error: 'Invalid file path' }` for invalid paths
- Fixed: C4 — Content-Disposition header injection: replaced `filename="${basename(filePath)}"` with RFC 5987 encoded `filename*=UTF-8''${encodeURIComponent(basename(filePath))}` in /files endpoint

### spx-uiux-verifier

- Fixed: C5 — Added `focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40` to "Set Folder" and "Cancel" buttons in FolderPicker text input overlay
- Fixed: C6 — Added `role="dialog"` and `aria-label="Enter workspace path"` to overlay panel div; added `aria-expanded={showTextInput}` and `aria-haspopup="dialog"` to trigger button in web-mode branch; added `aria-hidden="true"` to Folder and ChevronDown icons



### spx-verifier

- Fixed: onSlashCommands fallback changed from `msg as unknown as SlashCommand[]` to `[]` (safe empty array instead of corrupted object)
- Confirmed: session-updated event sends `sessionId` at top level — bridge's `msg.sessionId` access is correct (W-NEW-2 was false positive)
- Confirmed: safePath() in file-api.ts blocks traversal tricks; accepting any absolute path is intentional per design (C-NEW-1 — local-only server, no workspace confinement required by spec)


### spx-verifier

- Fixed: slash-commands array spread bug — changed `sendEvent('slash-commands', commands)` to `sendEvent('slash-commands', { commands })` in web-session.ts:395 so bridge receives `{ commands: SlashCommand[] }` correctly
- Fixed: missing `/api/chat/model-preference` endpoint — added `GET /api/config/model-preference` and `POST /api/config/model-preference` to config-api.ts; updated bridge to call `/api/config/model-preference`
- Fixed: client disconnect did not abort streaming session — added `interruptCurrentResponse(noopSend)` call in `ws.on('close')` handler in chat-ws.ts

### spx-arch-verifier

- Fixed: path traversal in file-api.ts — added `safePath()` function that calls `path.resolve(normalize(rawPath))` and rejects relative paths; applied to read-text, read-binary, info, and /files endpoints
- Fixed: no CORS protection on server — added origin/referer check middleware in server.ts that rejects requests from non-localhost origins with 403
- Fixed: WebSocket not closed on page unload — added `window.addEventListener('beforeunload', () => _wsInstance?.close())` in installWebBridge()
- Fixed: slash-commands also caught by arch-verifier — already fixed via spx-verifier fix above

### Notes

- W1 (lastCheckComplete: false vs spec true): Intentional deviation. spec says true, but true causes UpdateCheckFeedback to show "up to date" banner in web mode. Keeping false to suppress the banner.
- C2/C3 arch (shared mutable state): This is a single-user local server design. Multi-client concurrent session safety is out of scope per design.md Non-Goals ("Single local user only").
- W2 arch (DRY violations): Acknowledged. Standalone clones are intentional per design.md D1. Annotated with "keep in sync" comments.
- W4 arch (hardcoded WS URL): Acknowledged. Port 2810 is intentional and documented. Not creating a shared constant to avoid cross-boundary imports.
