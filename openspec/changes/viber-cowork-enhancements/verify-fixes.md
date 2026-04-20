## [2026-04-11] Round 1 (from spx-apply fix)

### spx-verifier

- Fixed: W1 — McpManager now accepts `sessionMcpServers` prop for live status indicators (connected/failed badges). App.tsx listens for session-init and passes MCP status to Settings → McpManager.
- Fixed: W2 — Model dropdown fallback now shows a disabled `<select>` with "Loading models…" placeholder instead of legacy Fast pill button.
- Fixed: W4 — Workspace Save button uses `workspaceDir || currentWorkspaceDir` for both save logic and disable check, so Save works when displaying current path.
- Fixed: Cleaned up unused legacy model pill code (modelPillClass, handleModelPreferenceSelect, handlePrimaryModelToggle, isSmartMode, lastSmartPreferenceRef, SmartModelVariant import).
