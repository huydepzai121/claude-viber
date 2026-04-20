## ADDED Requirements

### Requirement: Web server starts on port 2810
The system SHALL start an Express HTTP server on port 2810 when running in web mode. In dev mode, it SHALL proxy non-API requests to Vite dev server on port 5174. In production mode, it SHALL serve static files from `out/renderer/`.

#### Scenario: Server starts successfully
- **WHEN** `bun run dev:web` is executed
- **THEN** server listens on port 2810 and logs "Web server running at http://localhost:2810"

#### Scenario: Static file serving in production
- **WHEN** browser requests `/` in production mode
- **THEN** server responds with `out/renderer/index.html`

#### Scenario: Vite proxy in dev mode
- **WHEN** browser requests a non-API path (e.g., `/`) in dev mode
- **THEN** server proxies the request to Vite on port 5174

### Requirement: WebSocket endpoint for chat streaming
The server SHALL accept WebSocket connections at `/ws`. Each WS connection represents one chat session. The server SHALL process incoming command messages and emit streaming events in response.

#### Scenario: Client connects and sends a message
- **WHEN** browser opens WebSocket to `ws://localhost:2810/ws` and sends `{ type: "send-message", payload }`
- **THEN** server starts streaming events: `message-chunk`, `tool-use-start`, etc., and ends with `message-complete`

#### Scenario: Client requests stop
- **WHEN** client sends `{ type: "stop-message" }` over WebSocket
- **THEN** server interrupts the current response and emits `message-stopped`

#### Scenario: Session reset with resume
- **WHEN** client sends `{ type: "reset-session", resumeSessionId: "abc123" }`
- **THEN** server resets the session and resumes conversation from `abc123`

#### Scenario: Client disconnects mid-stream
- **WHEN** WebSocket connection drops while a response is streaming
- **THEN** server aborts the current streaming session and cleans up state

### Requirement: REST API for config operations
The server SHALL expose REST endpoints under `/api/config/` mirroring all config IPC handlers.

#### Scenario: Get workspace directory
- **WHEN** `GET /api/config/workspace-dir` is called
- **THEN** response is `{ workspaceDir: string }`

#### Scenario: Set workspace directory
- **WHEN** `POST /api/config/workspace-dir` with body `{ workspaceDir: string }` is called
- **THEN** response is `{ success: true }` and config is persisted to `~/.claude-agent-desktop/config.json`

#### Scenario: Browse folder returns text input signal
- **WHEN** `POST /api/config/browse-folder` is called
- **THEN** response is `{ canceled: true, folder: null }` (signals renderer to show text input)

#### Scenario: Get API key status
- **WHEN** `GET /api/config/api-key-status` is called
- **THEN** response includes `{ status: { configured: boolean, source, lastFour } }`

### Requirement: REST API for conversation operations
The server SHALL expose REST endpoints under `/api/conversation/` mirroring all conversation IPC handlers. Conversation data SHALL be stored in `~/.claude-agent-desktop/conversations/`.

#### Scenario: List conversations
- **WHEN** `GET /api/conversation` is called
- **THEN** response is `{ success: true, conversations: Conversation[] }`

#### Scenario: Create conversation
- **WHEN** `POST /api/conversation` with body `{ messages, sessionId }` is called
- **THEN** response is `{ success: true, conversation: Conversation }`

#### Scenario: Delete conversation
- **WHEN** `DELETE /api/conversation/:id` is called
- **THEN** response is `{ success: true }`

### Requirement: REST API for file operations
The server SHALL expose REST endpoints under `/api/file/` for file reading and info, plus a `GET /files` endpoint for serving files to the browser.

#### Scenario: Read text file
- **WHEN** `GET /api/file/read-text?path=<encoded>` is called
- **THEN** response is `{ content: string | null, error: string | null }`

#### Scenario: Open file in browser
- **WHEN** `GET /files?path=<encoded-path>` is called with a valid file path
- **THEN** server streams the file with appropriate Content-Type header

#### Scenario: Open file in browser - path not found
- **WHEN** `GET /files?path=<encoded-path>` is called with a non-existent path
- **THEN** server responds with 404

### Requirement: Standalone config storage
The web server SHALL store app config at `~/.claude-agent-desktop/config.json` (not using `app.getPath('userData')` from Electron).

#### Scenario: Default workspace directory
- **WHEN** no workspace dir is configured
- **THEN** default is `~/Desktop/claude-agent`

#### Scenario: Config persists across restarts
- **WHEN** API key is set via REST and server restarts
- **THEN** API key is still configured on next start
