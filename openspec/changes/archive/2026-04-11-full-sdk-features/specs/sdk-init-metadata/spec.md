## ADDED Requirements

### Requirement: Forward SDK init metadata to renderer

When the SDK emits a system message with subtype `init`, the main process SHALL forward the full session metadata to the renderer via a new IPC event `chat:session-init`.

#### Scenario: Session init received

- **WHEN** SDK emits `SDKSystemMessage` with `subtype: 'init'`
- **THEN** main process sends `chat:session-init` to renderer with: `tools`, `slash_commands`, `skills`, `plugins`, `mcp_servers`, `model`, `permissionMode`

#### Scenario: Renderer receives init metadata

- **WHEN** renderer receives `chat:session-init` event
- **THEN** the data is stored in React state accessible to ChatInput and session info components

### Requirement: Preload bridge exposes session-init listener

The preload bridge SHALL expose a listener for the `chat:session-init` IPC event via `window.electron.chat.onSessionInit()`.

#### Scenario: Preload registration

- **WHEN** the renderer calls `window.electron.chat.onSessionInit(callback)`
- **THEN** the callback is invoked when `chat:session-init` is received from main process
- **AND** returns an unsubscribe function

### Requirement: Fetch supported commands from SDK

After session init, the main process SHALL call `querySession.supportedCommands()` to get the full command list with descriptions and argument hints, then forward to renderer.

#### Scenario: Commands fetched after init

- **WHEN** session init completes and `querySession` is available
- **THEN** `supportedCommands()` is called
- **AND** result is sent to renderer via `chat:slash-commands` IPC event

#### Scenario: Commands include name, description, argumentHint

- **WHEN** renderer receives `chat:slash-commands`
- **THEN** each command has `name` (string), `description` (string), and `argumentHint` (string)
