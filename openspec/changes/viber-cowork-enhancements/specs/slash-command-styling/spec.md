## ADDED Requirements

### Requirement: Slash command visual prefix and color

When a slash command is selected or typed, the `/commandName` portion SHALL be displayed with a distinct accent color in the input area.

#### Scenario: Command selected from dropdown

- **WHEN** user selects a command from slash command menu
- **THEN** the command text in the input shows with `/` prefix in accent color

#### Scenario: User manually types slash command

- **WHEN** user types `/commit` manually
- **THEN** the `/commit` portion displays in accent color
