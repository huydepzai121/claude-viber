## ADDED Requirements

### Requirement: Settings gear icon in TitleBar

The TitleBar component SHALL display a gear icon button that navigates to the Settings page. The button MUST be placed to the left of the language toggle button in the right-side action area.

#### Scenario: User clicks Settings button

- **WHEN** user clicks the gear icon in the TitleBar
- **THEN** the app navigates to the Settings page view

#### Scenario: User clicks Settings while already on Settings

- **WHEN** user is on the Settings page and clicks the gear icon
- **THEN** the app navigates back to the home (chat) view

#### Scenario: Settings button accessibility

- **WHEN** the Settings button is rendered
- **THEN** it MUST have an appropriate aria-label and title attribute
- **AND** it MUST be keyboard focusable with visible focus ring
