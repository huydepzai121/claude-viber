## Why

The app needs Viber.vn branding, better UX for model selection and permissions, improved markdown rendering, slash command visual feedback, and MCP server management. These changes transform it from a generic Claude Agent Desktop into a branded Viber.vn Cowork product.

## What Changes

- **Model selector dropdown**: Replace Fast/Smart toggle with full model dropdown fetched from SDK `supportedModels()`
- **Bypass all permissions**: Change `permissionMode` to `bypassPermissions` so tools run without prompts
- **Viber.vn system prompt**: Rebrand system prompt with Viber.vn identity, author Huy, API service description, Telegram support link
- **Slash command color styling**: Show selected slash command with `/` prefix and accent color in the input area
- **Workspace directory in input**: Show current workspace path as input value/placeholder for clarity
- **Markdown rendering**: Add syntax highlighting for code blocks, proper styling for tables/headings/lists
- **MCP management UI**: Add MCP server management section in Settings (list, add, remove, status)

## Capabilities

### New Capabilities

- `model-selector`: Full model dropdown from SDK `supportedModels()` replacing Fast/Smart toggle
- `viber-branding`: System prompt rebranding + app identity as Viber.vn Cowork
- `bypass-permissions`: Auto-approve all tool permissions without prompts
- `slash-command-styling`: Visual `/` prefix and accent color for slash commands in input
- `markdown-enhanced`: Syntax highlighting, styled tables/headings/lists in chat messages
- `mcp-management`: MCP server list/add/remove/status UI in Settings

### Modified Capabilities

## Impact

- **Files modified**: `claude-session.ts` (system prompt, permissionMode, model fetch), `ChatInput.tsx` (model selector, slash styling), `Settings.tsx` (MCP section), `Markdown.tsx` (enhanced rendering), i18n files
- **New files**: MCP management component
- **Dependencies**: May add `rehype-highlight` or similar for syntax highlighting
- **Breaking**: `permissionMode` change from `acceptEdits` to `bypassPermissions` — tools run without confirmation
