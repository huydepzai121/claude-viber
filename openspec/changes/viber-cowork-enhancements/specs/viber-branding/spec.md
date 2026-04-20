## ADDED Requirements

### Requirement: Viber.vn system prompt identity

The system prompt SHALL identify the assistant as Viber.vn Cowork, built by author Huy, providing API services for Claude Code and Augment Code. It SHALL include the Telegram support link.

#### Scenario: System prompt content

- **WHEN** a new session starts
- **THEN** the system prompt includes Viber.vn branding, author attribution, service description, and Telegram link https://t.me/augmentsupporter

### Requirement: App title branding

The app empty state label SHALL show "Viber.vn Cowork" instead of "Claude Agent Desktop".

#### Scenario: Empty state display

- **WHEN** no messages in chat
- **THEN** the label shows "Viber.vn Cowork"
