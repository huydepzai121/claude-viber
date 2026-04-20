## ADDED Requirements

### Requirement: Remove hardcoded allowedTools restriction

The SDK `query()` call SHALL NOT specify `allowedTools`, allowing the SDK to use its full default tool set. Tool restrictions SHALL be managed via user settings.json instead.

#### Scenario: Session starts with full tools

- **WHEN** a new SDK session starts
- **THEN** the `allowedTools` option is NOT passed to `query()`
- **AND** the SDK init message reports all available tools (Read, Write, Edit, Grep, Glob, Bash, Agent, TodoWrite, etc.)

#### Scenario: User restricts tools via settings.json

- **WHEN** `~/.claude/settings.json` defines `allowedTools` or `disallowedTools`
- **THEN** the SDK CLI respects those restrictions
