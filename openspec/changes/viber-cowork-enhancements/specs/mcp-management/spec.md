## ADDED Requirements

### Requirement: MCP server list in Settings

The Settings page SHALL display a list of configured MCP servers read from `~/.claude/settings.json` with their name, type, and connection status.

#### Scenario: Servers listed

- **WHEN** user opens Settings and MCP servers are configured
- **THEN** each server shows: name, type (stdio/sse/http), and status indicator

#### Scenario: No servers configured

- **WHEN** no MCP servers are in settings.json
- **THEN** an empty state message is shown with an "Add server" prompt

### Requirement: Add MCP server

The Settings page SHALL allow adding a new MCP stdio server by specifying command and optional args.

#### Scenario: Add stdio server

- **WHEN** user fills in server name and command, then clicks Add
- **THEN** the server is written to `~/.claude/settings.json` under `mcpServers`
- **AND** the server list updates to show the new entry

### Requirement: Remove MCP server

The Settings page SHALL allow removing an MCP server from the configuration.

#### Scenario: Remove server

- **WHEN** user clicks remove on a server entry
- **THEN** the server is removed from `~/.claude/settings.json`
- **AND** the server list updates
