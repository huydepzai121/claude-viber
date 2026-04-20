## ADDED Requirements

### Requirement: Include user settings source

The SDK `query()` call SHALL use `settingSources: ['user', 'project']` so the SDK CLI reads both `~/.claude/settings.json` (user-level) and project-level `.claude/` settings.

#### Scenario: User has ~/.claude/settings.json with MCP servers

- **WHEN** `~/.claude/settings.json` contains MCP server configurations
- **THEN** the SDK session loads those MCP servers automatically

#### Scenario: User has no ~/.claude/settings.json

- **WHEN** `~/.claude/settings.json` does not exist
- **THEN** the SDK session starts normally without errors

#### Scenario: User settings merged with project settings

- **WHEN** both user and project settings define configurations
- **THEN** the SDK merges them with its built-in precedence rules
