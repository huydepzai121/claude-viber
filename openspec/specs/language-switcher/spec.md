## ADDED Requirements

### Requirement: TitleBar language quick toggle

The TitleBar SHALL display a compact language toggle button showing the current language code (EN or VI). Clicking it SHALL cycle to the other language immediately.

#### Scenario: Toggle from English to Vietnamese

- **WHEN** current language is `'en'` and user clicks the language toggle
- **THEN** language SHALL switch to `'vi'` and the toggle SHALL display `VI`

#### Scenario: Toggle from Vietnamese to English

- **WHEN** current language is `'vi'` and user clicks the language toggle
- **THEN** language SHALL switch to `'en'` and the toggle SHALL display `EN`

#### Scenario: Toggle button visual style

- **WHEN** TitleBar renders
- **THEN** the language toggle SHALL be a pill-shaped button styled consistently with the existing TitleBar action buttons, using theme tokens

### Requirement: Settings language selector

The Settings page SHALL include a "Language" section with a selector showing both available languages (English, Tiếng Việt) with their native names. The currently active language SHALL be visually highlighted.

#### Scenario: Language section displays in Settings

- **WHEN** Settings page renders
- **THEN** a "Language" section SHALL appear with two selectable options: "English" and "Tiếng Việt"

#### Scenario: Current language is highlighted

- **WHEN** the current language is `'vi'`
- **THEN** the "Tiếng Việt" option SHALL be visually highlighted (e.g., accent border or background)

#### Scenario: Changing language in Settings

- **WHEN** user selects a different language in Settings
- **THEN** the language SHALL change immediately, the UI SHALL re-render with new translations, and the preference SHALL persist

### Requirement: Language switcher accessibility

Both the TitleBar toggle and Settings selector SHALL be keyboard accessible and have appropriate ARIA attributes.

#### Scenario: TitleBar toggle is keyboard accessible

- **WHEN** user navigates to the language toggle via Tab key
- **THEN** the toggle SHALL receive focus and be activatable via Enter or Space

#### Scenario: Settings selector has ARIA labels

- **WHEN** a screen reader encounters the language selector
- **THEN** each option SHALL have an `aria-label` indicating the language name and selection state
