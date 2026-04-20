## ADDED Requirements

### Requirement: CSS custom properties define all theme colors

The system SHALL define all UI colors as CSS custom properties in `index.css` under `:root`. The token set SHALL include backgrounds (deepest, primary, surface, elevated, raised), text (primary, secondary, muted, disabled), accents (default, hover, active, deep), borders (subtle, medium, strong), and status colors (success, error, warning, info).

#### Scenario: Theme tokens are available globally

- **WHEN** any renderer component renders
- **THEN** all CSS custom properties (`--bg-primary`, `--text-primary`, `--accent`, etc.) SHALL be accessible via `var()` references

#### Scenario: Token values match the purple palette

- **WHEN** inspecting computed styles
- **THEN** `--bg-primary` SHALL be `#13111c`, `--accent` SHALL be `#8b5cf6`, `--text-primary` SHALL be `#ede8f5`

### Requirement: All light mode styles are removed

The system SHALL NOT contain any light-mode-specific styles. All `dark:` Tailwind prefixes, `prefers-color-scheme` media queries, and light-mode color values (e.g., `bg-white`, `text-neutral-900`) SHALL be removed from all renderer files.

#### Scenario: No light mode classes remain

- **WHEN** searching the `src/renderer/` directory for `dark:` prefixed Tailwind classes
- **THEN** zero matches SHALL be found

#### Scenario: No prefers-color-scheme media queries remain

- **WHEN** searching `src/renderer/index.css` for `prefers-color-scheme`
- **THEN** zero matches SHALL be found

### Requirement: All components use theme tokens

Every renderer component SHALL reference CSS custom properties (directly or via Tailwind utility classes mapped to the tokens) instead of hardcoded color values for backgrounds, text, borders, and accents.

#### Scenario: TitleBar uses theme tokens

- **WHEN** TitleBar renders
- **THEN** its background SHALL use `--bg-deepest` with backdrop blur, border SHALL use `--border-subtle`, and text SHALL use `--text-primary`

#### Scenario: ChatInput uses theme tokens

- **WHEN** ChatInput renders
- **THEN** the container SHALL use `--bg-surface` background, `--border-medium` ring, and the send button SHALL use `--accent` background

#### Scenario: User message bubble uses theme tokens

- **WHEN** a user message renders
- **THEN** the bubble SHALL use `--bg-raised` background with `--border-medium` border

#### Scenario: ChatHistoryDrawer uses theme tokens

- **WHEN** ChatHistoryDrawer opens
- **THEN** it SHALL use `--bg-deepest` with backdrop blur and `--border-subtle` borders

### Requirement: Tool badge colors maintain contrast on purple background

Tool badge color categories (green for files, amber for terminal, blue for search, etc.) SHALL maintain a minimum contrast ratio of 4.5:1 against the surface background for text elements.

#### Scenario: Tool badge text is readable

- **WHEN** a tool badge renders on a `--bg-surface` background
- **THEN** the badge text color SHALL have a contrast ratio of at least 4.5:1 against `--bg-surface` (#1a1528)

### Requirement: Settings page uses theme tokens

The Settings page SHALL use theme tokens for all backgrounds, inputs, buttons, and text. Primary action buttons SHALL use `--accent` as background color.

#### Scenario: Settings renders with purple theme

- **WHEN** Settings page renders
- **THEN** page background SHALL use `--bg-primary`, card background SHALL use `--bg-surface`, inputs SHALL use `--bg-elevated`, and save buttons SHALL use `--accent`
