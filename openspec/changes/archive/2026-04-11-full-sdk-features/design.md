## Context

Electron desktop app wrapping the Anthropic Claude Agent SDK (`@anthropic-ai/claude-agent-sdk@^0.1.51`). Currently the app:

- Stores config in Electron `userData/config.json` (`AppConfig`: `workspaceDir`, `debugMode`, `chatModelPreference`, `apiKey`)
- Calls `query()` with hardcoded `allowedTools: ['Bash', 'WebFetch', 'WebSearch', 'Skill']`
- Uses `settingSources: ['project']` — ignores `~/.claude/settings.json`
- Processes `SDKSystemMessage` (init) but only extracts `session_id` — drops `tools`, `slash_commands`, `skills`, `plugins`, `mcp_servers`
- Has no Settings button on TitleBar (only accessible via Electron menu)
- ChatInput has no slash-command awareness

SDK `Options` interface supports: `plugins`, `hooks`, `mcpServers`, `settingSources: ['user', 'project']`, `agents`, and many more fields the app doesn't use.

SDK `Query` object exposes: `supportedCommands()`, `supportedModels()`, `mcpServerStatus()`, `accountInfo()`.

SDK `SDKSystemMessage` (init) contains: `tools[]`, `slash_commands[]`, `skills[]`, `plugins[]`, `mcp_servers[]`.

The SDK spawns Claude Code CLI as a subprocess. The CLI respects `ANTHROPIC_BASE_URL` env var for custom API endpoints.

## Goals / Non-Goals

**Goals:**

- Enable full SDK capability surface (all tools, user settings, plugins, MCP, hooks)
- Add Settings button to TitleBar for easy access
- Support custom API Base URL for proxy/third-party endpoints
- Expose SDK session metadata (commands, tools, skills, MCP) to renderer
- Provide slash command autocomplete when user types `/` in ChatInput
- Show session info (loaded tools, MCP status, skills) in chat UI

**Non-Goals:**

- Custom MCP server configuration UI (rely on `~/.claude/settings.json` for now)
- Plugin management UI (discovery, install, enable/disable)
- Custom hooks configuration UI
- Permission management UI (SDK handles permissions internally)
- Settings.json editor (users edit `~/.claude/settings.json` manually)

## Decisions

### D1: Settings access — TitleBar button

Add a gear icon (`Settings` from lucide-react) to TitleBar right side, before the language toggle. Uses existing `window.electron.onNavigate('settings')` pattern via a new IPC call or direct state lift.

**Alternative**: Floating settings button in chat → rejected, TitleBar is consistent with existing UI pattern.

**Decision**: Pass `onOpenSettings` callback to TitleBar, call `setCurrentView('settings')` in App.tsx. Same pattern as `onOpenHistory`.

### D2: settingSources — add 'user'

Change from `['project']` to `['user', 'project']`. This one-line change makes the SDK CLI read `~/.claude/settings.json` automatically.

**Alternative**: Manually parse settings.json in Electron main process → rejected, SDK already handles this natively with proper merge semantics.

### D3: allowedTools — remove restriction

Remove the `allowedTools` array entirely from `query()` options. SDK defaults to all available tools. The user's settings.json `allowedTools` and `disallowedTools` will take effect.

**Alternative**: Read tools from settings.json and merge → rejected, removing the restriction lets SDK handle it with proper precedence.

### D4: Custom API Base URL — env var injection

Add `apiBaseUrl?: string` to `AppConfig`. In `buildClaudeSessionEnv()`, set `env.ANTHROPIC_BASE_URL = config.apiBaseUrl` when configured. SDK CLI will use this for API calls.

**Alternative**: SDK-level base URL option → not available in SDK Options interface. Env var is the supported mechanism.

### D5: SDK init metadata — IPC forwarding

When `SDKSystemMessage` (subtype: `init`) arrives, forward full metadata to renderer via new IPC event `chat:session-init`. Store in renderer state for slash-command autocomplete and session info display.

**Data forwarded**: `tools`, `slash_commands`, `skills`, `plugins`, `mcp_servers`, `model`, `permissionMode`.

### D6: Slash command autocomplete — lightweight dropdown

When user types `/` as the first character in ChatInput, show a filtered dropdown of commands. Data source: `slash_commands` from init metadata (available immediately) enriched with descriptions from `querySession.supportedCommands()` (async, cached).

**Approach**: New `SlashCommandMenu` component rendered above textarea. Filter as user types. Select on click or Enter. Dismiss on Escape or blur.

**Alternative**: Full command palette (Cmd+K style) → over-engineered for now, slash dropdown is sufficient.

### D7: Session info — minimal status bar

Show a subtle info bar below TitleBar or above ChatInput showing: tool count, MCP server count + status, active skills count. Collapsible/dismissable.

**Alternative**: Full debug sidebar → already have debug mode for that. This is a lightweight always-visible indicator.

## Risks / Trade-offs

- **[Full tools enabled]** → Users may see more permission prompts. Mitigation: `permissionMode: 'acceptEdits'` is already set, and user settings.json can restrict tools.
- **[User settings.json missing]** → SDK handles gracefully — no error if file doesn't exist. No mitigation needed.
- **[Custom base URL + incompatible API]** → Third-party APIs may not support all Anthropic features. Mitigation: This is user responsibility; we just pass the URL through.
- **[Init metadata timing]** → Slash commands only available after session starts. Mitigation: Show "no commands available" state until session init completes; cache commands for instant display on subsequent messages.
- **[Large slash command list]** → Some users may have many custom commands. Mitigation: Scrollable dropdown with fuzzy filter.
