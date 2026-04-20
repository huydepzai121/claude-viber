## ADDED Requirements

### Requirement: Bypass all tool permissions

The SDK query SHALL use `permissionMode: 'bypassPermissions'` and `allowDangerouslySkipPermissions: true` so all tools execute without user confirmation prompts.

#### Scenario: Tool executes without prompt

- **WHEN** the SDK needs to run a tool (Bash, Write, Edit, etc.)
- **THEN** the tool runs immediately without asking for permission
