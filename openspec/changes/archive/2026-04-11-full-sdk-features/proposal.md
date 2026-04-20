## Why

The app currently uses a fraction of the Claude Agent SDK capabilities. Tools are hardcoded to 4 (`Bash`, `WebFetch`, `WebSearch`, `Skill`), settings are read only from a local `config.json` (ignoring `~/.claude/settings.json`), slash commands have no UI autocomplete, and there is no Settings button on the title bar. Users cannot configure custom API endpoints (e.g., OpenRouter proxy) or benefit from MCP servers, plugins, hooks, and skills they already configured in their Claude Code setup.

## What Changes

- **Settings button on TitleBar**: Add a gear icon button to navigate to Settings page directly from the UI (currently only accessible via Electron menu).
- **Custom API Base URL**: Add `apiBaseUrl` field to config and Settings UI, inject as `ANTHROPIC_BASE_URL` env var so the SDK CLI can use third-party API-compatible proxies.
- **Read `~/.claude/settings.json`**: Change `settingSources` from `['project']` to `['user', 'project']` so the SDK reads user-level settings (MCP servers, permissions, hooks, plugins).
- **Unlock full SDK tools**: Remove hardcoded `allowedTools` array so all SDK-provided tools are available (Read, Write, Edit, Grep, Glob, Agent, TodoWrite, etc.).
- **Expose SDK init metadata to renderer**: Forward `tools`, `slash_commands`, `skills`, `plugins`, `mcp_servers` from `SDKSystemMessage` (init) to the renderer via IPC.
- **Slash command autocomplete**: When user types `/` in ChatInput, show a dropdown of available commands (sourced from SDK `supportedCommands()` and init metadata).
- **Session info display**: Show loaded tools count, MCP server status, and active skills in the chat UI for transparency.

## Capabilities

### New Capabilities

- `settings-button`: TitleBar gear icon for direct Settings page navigation
- `custom-api-endpoint`: API Base URL configuration for third-party proxy support
- `user-settings-integration`: Merge `~/.claude/settings.json` with local app config
- `full-sdk-tools`: Unlock all SDK tools instead of hardcoded subset
- `sdk-init-metadata`: Forward SDK session init data (tools, commands, skills, MCP, plugins) to renderer
- `slash-command-autocomplete`: Dropdown autocomplete for slash commands in ChatInput
- `session-info-display`: Show session capabilities (tools, MCP, skills) in chat UI

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Files modified**: `TitleBar.tsx`, `App.tsx`, `config.ts`, `Settings.tsx`, `claude-session.ts`, `ChatInput.tsx`, `Chat.tsx`, IPC handlers, preload bridge, i18n translations
- **New files**: Slash command autocomplete component, session info component
- **Dependencies**: No new packages — all features use existing SDK APIs (`supportedCommands()`, `mcpServerStatus()`, init message fields)
- **Config**: `AppConfig` interface gains `apiBaseUrl` field; backward compatible (optional)
- **Breaking changes**: None — all changes are additive
