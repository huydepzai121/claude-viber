## ADDED Requirements

### Requirement: Session info indicator

The chat UI SHALL display a subtle session info indicator showing the current session capabilities.

#### Scenario: Session active with metadata

- **WHEN** session is active and init metadata has been received
- **THEN** display a compact info bar showing: number of tools loaded, number of MCP servers (with connected/failed counts), number of skills active

#### Scenario: Session not started

- **WHEN** no session is active
- **THEN** session info indicator is NOT displayed

#### Scenario: Info bar interaction

- **WHEN** user clicks or hovers the session info indicator
- **THEN** an expanded view shows detailed lists (tool names, MCP server names + statuses, skill names)
