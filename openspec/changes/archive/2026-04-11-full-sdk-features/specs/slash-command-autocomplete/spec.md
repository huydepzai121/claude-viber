## ADDED Requirements

### Requirement: Slash command dropdown trigger

When user types `/` as the first character in the ChatInput textarea, the system SHALL display a dropdown menu of available slash commands.

#### Scenario: User types / at start of input

- **WHEN** user types `/` and the input starts with `/`
- **THEN** a dropdown menu appears above the textarea showing available commands

#### Scenario: User types / in middle of text

- **WHEN** user types `/` but input does not start with `/`
- **THEN** no dropdown is shown

#### Scenario: Empty command list

- **WHEN** user types `/` but no commands are available (session not started)
- **THEN** dropdown is NOT shown

### Requirement: Slash command filtering

The dropdown SHALL filter commands as user continues typing after `/`.

#### Scenario: Partial match filtering

- **WHEN** user types `/com`
- **THEN** dropdown shows only commands whose name contains `com` (e.g., `/commit`, `/compact`)

#### Scenario: No match

- **WHEN** user types `/xyz` and no command matches
- **THEN** dropdown shows "No matching commands" or is hidden

### Requirement: Slash command selection

User SHALL be able to select a command from the dropdown.

#### Scenario: Click to select

- **WHEN** user clicks a command in the dropdown
- **THEN** the input value is replaced with the command name followed by a space
- **AND** the dropdown closes

#### Scenario: Arrow keys and Enter to select

- **WHEN** user uses arrow keys to highlight a command and presses Enter
- **THEN** the input value is replaced with the command name followed by a space
- **AND** the dropdown closes

#### Scenario: Escape to dismiss

- **WHEN** user presses Escape while dropdown is visible
- **THEN** the dropdown closes without changing input

### Requirement: Slash command display format

Each item in the dropdown SHALL show the command name, description, and argument hint.

#### Scenario: Command item display

- **WHEN** a command `{name: "/commit", description: "Commit changes", argumentHint: "[message]"}` is shown
- **THEN** it displays: `/commit` (bold), `Commit changes`, and `[message]` (muted)
