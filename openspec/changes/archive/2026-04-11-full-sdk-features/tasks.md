## 1. Settings Button on TitleBar

- [x] 1.1 Add `onOpenSettings` prop to TitleBar component and render gear icon button (lucide `Settings`) to the left of language toggle
- [x] 1.2 Update App.tsx to pass `onOpenSettings={() => setCurrentView('settings')}` to TitleBar and wire toggle behavior (settings→home if already on settings)
- [x] 1.3 Add i18n keys for settings button (`titleBar.openSettings`) in both EN and VI translations ← (verify: button renders, navigates to Settings, toggles back, has correct aria-label)

## 2. SDK Config Unlocking (settingSources + tools)

- [x] 2.1 In `claude-session.ts`, change `settingSources: ['project']` to `settingSources: ['user', 'project']`
- [x] 2.2 Remove `allowedTools: ['Bash', 'WebFetch', 'WebSearch', 'Skill']` from the `query()` options ← (verify: session starts with full tools, `~/.claude/settings.json` MCP servers load, no regressions)

## 3. Custom API Base URL

- [x] 3.1 Add `apiBaseUrl?: string` to `AppConfig` interface in `config.ts`
- [x] 3.2 Add `getApiBaseUrl()` helper function in `config.ts`
- [x] 3.3 In `buildClaudeSessionEnv()`, inject `ANTHROPIC_BASE_URL` when `apiBaseUrl` is configured
- [x] 3.4 Add API Base URL input field section in `Settings.tsx` with save/clear functionality
- [x] 3.5 Add IPC handler `config:get-api-base-url` and `config:set-api-base-url` in config-handlers.ts
- [x] 3.6 Expose new IPC methods in preload bridge and electron.d.ts
- [x] 3.7 Add i18n keys for API Base URL section ← (verify: base URL saved to config, injected in env, session uses custom endpoint, clearing URL falls back to default)

## 4. SDK Init Metadata Forwarding

- [x] 4.1 In `claude-session.ts`, when `sdkMessage.type === 'system' && subtype === 'init'`, send `chat:session-init` IPC event with `tools`, `slash_commands`, `skills`, `plugins`, `mcp_servers`, `model`, `permissionMode`
- [x] 4.2 After init, call `querySession.supportedCommands()` and send result via `chat:slash-commands` IPC event
- [x] 4.3 Add `onSessionInit` and `onSlashCommands` listeners in preload bridge (`preload/index.ts`)
- [x] 4.4 Add TypeScript types for session init metadata and slash commands in `shared/types/ipc.ts`
- [x] 4.5 Update `electron.d.ts` with new IPC method types ← (verify: renderer receives init metadata with correct fields, supportedCommands data arrives with name/description/argumentHint)

## 5. Slash Command Autocomplete

- [x] 5.1 Create `SlashCommandMenu.tsx` component: dropdown rendered above textarea, displays filtered command list with name (bold), description, and argumentHint (muted)
- [x] 5.2 Add slash-command state management in ChatInput or Chat.tsx: store commands from IPC, detect `/` at start of input, filter list
- [x] 5.3 Implement keyboard navigation in SlashCommandMenu: arrow keys, Enter to select, Escape to dismiss
- [x] 5.4 On command selection: replace input with command name + space, close dropdown
- [x] 5.5 Add i18n keys for "No matching commands" empty state ← (verify: dropdown appears on `/`, filters correctly, keyboard nav works, selection replaces input, dismisses on Escape)

## 6. Session Info Display

- [x] 6.1 Create `SessionInfo.tsx` component: compact bar showing tools count, MCP server count with status indicators, skills count
- [x] 6.2 Store session init metadata in Chat.tsx state and pass to SessionInfo
- [x] 6.3 Add expandable detail view on click/hover showing tool names, MCP server names+statuses, skill names
- [x] 6.4 Add i18n keys for session info labels ← (verify: info bar shows after session init, counts are correct, detail view expands, hidden when no session)

## 7. Integration Verification

- [x] 7.1 Run typecheck, lint, and test to ensure no regressions
- [ ] 7.2 Manual test: start app, verify Settings button works, slash commands appear, session info displays ← (verify: full end-to-end flow works — Settings accessible, full tools in session, slash autocomplete functional, session info accurate)
