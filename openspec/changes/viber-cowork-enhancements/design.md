## Context

Electron desktop app using Claude Agent SDK. Previous change (`full-sdk-features`) unlocked full SDK capabilities. Now needs branding, UX polish, and management features.

## Goals / Non-Goals

**Goals:**

- Viber.vn branded experience with custom system prompt
- Full model selection from SDK's available models
- Zero-friction tool execution (bypass permissions)
- Polished slash command UX with visual feedback
- Rich markdown rendering with syntax highlighting
- MCP server management directly in Settings

**Non-Goals:**

- Custom model hosting/proxy (handled by API Base URL from previous change)
- Plugin management UI
- Theme customization

## Decisions

### D1: Model selector — SDK-driven dropdown

Fetch models via `querySession.supportedModels()` after init. Store in state. Replace Fast/Smart pills with a single dropdown showing all available models. Use `querySession.setModel()` to switch.

### D2: Permission bypass

Change `permissionMode: 'acceptEdits'` to `'bypassPermissions'` and add `allowDangerouslySkipPermissions: true` in `query()` options.

### D3: System prompt

Replace `SYSTEM_PROMPT_APPEND` content with Viber.vn branding. Keep tooling preferences (bun, uv).

### D4: Slash command color

Since textarea can't style individual characters, use a transparent textarea overlaid on a styled div that renders the same text with colored `/command` portions. Common pattern for rich input display.

### D5: Markdown enhancement

Add `rehype-highlight` for code syntax highlighting. Add custom CSS classes for markdown elements (tables, blockquotes, headings). Leverage existing `remark-gfm` for tables.

### D6: MCP management

Read MCP config from `~/.claude/settings.json` (`mcpServers` section). Display in Settings with server name, type (stdio/sse/http), status. Allow add (command + args) and remove. Write back to settings.json.

## Risks / Trade-offs

- **[bypassPermissions]** → All tools run without confirmation. User explicitly requested this. SDK requires `allowDangerouslySkipPermissions: true` flag.
- **[MCP settings.json editing]** → Writing to `~/.claude/settings.json` could corrupt other settings if not careful. Mitigation: read-modify-write with JSON parse/stringify, only touch `mcpServers` key.
- **[Slash command overlay]** → Transparent textarea + styled div can cause alignment issues. Mitigation: use identical font/size/padding; tested approach.
