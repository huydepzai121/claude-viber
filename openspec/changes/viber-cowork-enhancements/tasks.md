## 1. Viber.vn Branding & Permissions

- [x] 1.1 Replace `SYSTEM_PROMPT_APPEND` in `claude-session.ts` with Viber.vn branding (identity, author Huy, API service description, Telegram link, keep tooling preferences)
- [x] 1.2 Change `permissionMode: 'acceptEdits'` to `'bypassPermissions'` and add `allowDangerouslySkipPermissions: true` in `query()` options
- [x] 1.3 Update app empty state label from "Claude Agent Desktop" to "Viber.vn Cowork" in i18n files ← (verify: system prompt contains Viber.vn branding, permissions bypassed, empty state shows new name)

## 2. Model Selector Dropdown

- [x] 2.1 Add `chat:supported-models` IPC event: after session init, call `querySession.supportedModels()` and forward result to renderer
- [x] 2.2 Add `onSupportedModels` listener in preload bridge and `electron.d.ts`
- [x] 2.3 Add `ModelInfo` type to `shared/types/ipc.ts` (value, displayName, description)
- [x] 2.4 Store supported models in Chat.tsx state, pass to ChatInput
- [x] 2.5 Replace Fast/Smart pill toggle in ChatInput with a model dropdown selector showing all available models
- [x] 2.6 On model selection, call existing `setModelPreference` IPC or add new `chat:set-model-direct` to call `querySession.setModel()`
- [x] 2.7 Add i18n keys for model selector ← (verify: dropdown shows SDK models, selection changes model, persists across messages)

## 3. Slash Command Styling

- [x] 3.1 Add a styled overlay div behind the textarea that renders the same text with `/command` portion in accent color
- [x] 3.2 Ensure overlay and textarea have identical font, size, padding, line-height for perfect alignment
- [x] 3.3 Make textarea text transparent when slash command is detected, so overlay shows through ← (verify: `/command` text shows in accent color, rest of text normal, alignment perfect)

## 4. Workspace Directory UX

- [x] 4.1 In Settings.tsx, set workspace input value to `currentWorkspaceDir` as default (editable), remove separate display box ← (verify: current path visible in input field, editable, saves correctly)

## 5. Enhanced Markdown Rendering

- [x] 5.1 Install `rehype-highlight` (or equivalent) package for syntax highlighting
- [x] 5.2 Update `Markdown.tsx` to use rehype-highlight plugin and import highlight.js CSS theme
- [x] 5.3 Add custom CSS styles for markdown elements: tables (borders, header bg, alternating rows), blockquotes (left border, bg), headings (font sizes), code blocks (rounded, bg), inline code (bg, padding) ← (verify: code blocks have syntax colors, tables styled, headings sized, blockquotes styled)

## 6. MCP Server Management

- [x] 6.1 Add IPC handlers to read/write MCP servers from `~/.claude/settings.json` (`config:get-mcp-servers`, `config:set-mcp-servers`)
- [x] 6.2 Add preload bridge methods and types for MCP server CRUD
- [x] 6.3 Create `McpManager.tsx` component: list servers with name/type/status, add form (name + command + args), remove button
- [x] 6.4 Add MCP Management section in Settings.tsx using McpManager component
- [x] 6.5 Add i18n keys for MCP management labels ← (verify: servers listed from settings.json, add creates entry, remove deletes, status shown)

## 7. Integration

- [x] 7.1 Run typecheck, lint, test, format
- [ ] 7.2 Manual test ← (verify: all 7 features work end-to-end)
