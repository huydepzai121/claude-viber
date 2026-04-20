## Why

The current UI uses a neutral gray palette with both light and dark modes. The goal is to rebrand with a dark-only purple/violet theme to match the target design aesthetic, remove Chinese language support (none found — already English-only), add English/Vietnamese bilingual support via a lightweight i18n system, and prepare the UI for future web compatibility.

## What Changes

- **BREAKING**: Remove all light mode styles — app becomes dark-only with a purple/violet palette
- Add CSS custom properties for the new color tokens (backgrounds: `#0d0b14`→`#2a2240`, accent: `#8b5cf6`, text: `#ede8f5`/`#b8aed0`/`#8578a0`)
- Add a simple i18n system (React Context + JSON translation files) supporting English and Vietnamese
- Add language quick-toggle in TitleBar and full language selector in Settings page
- Update all renderer components to use new theme tokens and translation hooks
- Adjust tool badge colors for contrast on purple backgrounds

## Capabilities

### New Capabilities

- `purple-theme`: Dark-only purple/violet color system using CSS custom properties and Tailwind, replacing the existing neutral light/dark theme
- `i18n-system`: Simple React Context-based internationalization supporting English and Vietnamese with JSON translation files, localStorage persistence, and fallback behavior
- `language-switcher`: Language toggle UI in TitleBar (quick toggle) and Settings page (full selector with preview)

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Files affected**: ~20 renderer files (all components, pages, CSS, constants)
- **index.css**: Complete rewrite of theme variables, removal of light mode styles and dark: media queries
- **New files**: `src/renderer/i18n/` directory (context.tsx, en.json, vi.json)
- **No backend changes**: All changes are in `src/renderer/`
- **No new dependencies**: i18n system is custom-built with React Context
- **Breaking**: Light mode will no longer be available
