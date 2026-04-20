## ADDED Requirements

### Requirement: Web bridge implements full ElectronAPI interface
The web bridge SHALL implement the complete `ElectronAPI` TypeScript interface defined in `src/renderer/electron.d.ts`, using `fetch` for REST calls and WebSocket for streaming chat events. It SHALL be installed onto `window.electron` before React mounts.

#### Scenario: Bridge installed in web mode
- **WHEN** renderer loads in a browser (no `window.__ELECTRON__` flag)
- **THEN** `window.electron` is populated with the web bridge before `ReactDOM.createRoot` is called

#### Scenario: Bridge NOT installed in Electron mode
- **WHEN** renderer loads inside Electron (preload sets `window.__ELECTRON__ = true`)
- **THEN** web bridge is NOT loaded and `window.electron` is the native Electron contextBridge API

### Requirement: Chat streaming via WebSocket
The web bridge's `chat.*` methods SHALL use a single WebSocket connection to `/ws`. Event subscription methods (`onMessageChunk`, `onToolUseStart`, etc.) SHALL register listeners on the WebSocket message dispatcher and return an unsubscribe function.

#### Scenario: Subscribe to message chunks
- **WHEN** renderer calls `window.electron.chat.onMessageChunk(callback)` and a message streams
- **THEN** callback is invoked for each `{ type: "message-chunk" }` WS event, and calling the returned function removes the listener

#### Scenario: Send message
- **WHEN** renderer calls `window.electron.chat.sendMessage(payload)`
- **THEN** bridge sends `{ type: "send-message", payload }` over WebSocket and returns `{ success: true }`

#### Scenario: AskUserQuestion round-trip
- **WHEN** server sends `{ type: "ask-user-question", data }` over WebSocket
- **THEN** bridge calls all registered `onAskUserQuestion` listeners with the data
- **WHEN** renderer calls `window.electron.chat.answerUserQuestion(answers)`
- **THEN** bridge sends `{ type: "answer-user-question", answers }` to server

### Requirement: WebSocket auto-reconnect with session resume
The web bridge SHALL automatically reconnect if the WebSocket connection is lost. On reconnect, it SHALL send a `reset-session` command with the last known `sessionId` to resume the conversation.

#### Scenario: Reconnect after disconnect
- **WHEN** WebSocket connection drops
- **THEN** bridge attempts reconnect after 2 seconds (exponential backoff, max 30s)

#### Scenario: Session resume on reconnect
- **WHEN** reconnection succeeds and `lastSessionId` is known
- **THEN** bridge sends `{ type: "reset-session", resumeSessionId: lastSessionId }` immediately after reconnect

### Requirement: Update API gracefully degraded
The web bridge's `update.*` methods SHALL be no-ops that return safe default values without errors, since auto-update is not applicable in web mode.

#### Scenario: getStatus returns idle state
- **WHEN** renderer calls `window.electron.update.getStatus()`
- **THEN** returns `{ checking: false, updateAvailable: false, downloading: false, downloadProgress: 0, readyToInstall: false, error: null, updateInfo: null, lastCheckComplete: true }`

#### Scenario: onStatusChanged never fires
- **WHEN** renderer subscribes to `window.electron.update.onStatusChanged(cb)`
- **THEN** callback is never invoked and an unsubscribe no-op function is returned

### Requirement: browseFolder returns text input signal
The web bridge's `config.browseFolder()` SHALL always return `{ canceled: true, folder: null }`, signaling the renderer to show a text input instead of a native file dialog.

#### Scenario: Browse folder in web mode
- **WHEN** renderer calls `window.electron.config.browseFolder()`
- **THEN** returns `{ canceled: true, folder: null }` immediately

### Requirement: Navigate event not triggered from server in web mode
The web bridge's `onNavigate` subscription SHALL register a listener but the server SHALL NOT send navigate events (navigation is driven by UI buttons only in web mode).

#### Scenario: Navigation via UI
- **WHEN** user clicks Settings button in the UI
- **THEN** navigation happens via React state, not via `onNavigate` callback

### Requirement: shell.openExternal opens in new tab
The web bridge's `shell.openExternal(url)` SHALL call `window.open(url, '_blank')` to open the URL in a new browser tab.

#### Scenario: Open external link
- **WHEN** renderer calls `window.electron.shell.openExternal("https://example.com")`
- **THEN** browser opens `https://example.com` in a new tab and returns `{ success: true }`
