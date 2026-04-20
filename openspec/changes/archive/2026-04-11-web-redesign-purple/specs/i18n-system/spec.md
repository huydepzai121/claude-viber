## ADDED Requirements

### Requirement: LanguageProvider wraps the application

The system SHALL provide a `LanguageProvider` React Context that wraps the entire application in `App.tsx`. It SHALL expose `language`, `setLanguage`, and `t` (translation function) via a `useTranslation` hook.

#### Scenario: Provider initializes with default language

- **WHEN** the app starts and no language preference is stored
- **THEN** the language SHALL default to `'en'`

#### Scenario: Provider restores persisted language

- **WHEN** the app starts and `localStorage` contains `app-language: 'vi'`
- **THEN** the language SHALL initialize to `'vi'`

### Requirement: Translation function returns correct strings

The `t()` function SHALL accept a dot-notation key (e.g., `'chat.placeholder'`) and return the corresponding string from the active language's translation file.

#### Scenario: English translation returned

- **WHEN** language is `'en'` and `t('chat.placeholder')` is called
- **THEN** it SHALL return `"How can I help you today?"`

#### Scenario: Vietnamese translation returned

- **WHEN** language is `'vi'` and `t('chat.placeholder')` is called
- **THEN** it SHALL return the Vietnamese equivalent string

### Requirement: Fallback chain for missing translations

The `t()` function SHALL implement a fallback chain: active language value → English value → raw key string.

#### Scenario: Missing Vietnamese translation falls back to English

- **WHEN** language is `'vi'` and a key exists only in `en.json`
- **THEN** `t()` SHALL return the English value

#### Scenario: Missing key in all languages returns key string

- **WHEN** `t('nonexistent.key')` is called
- **THEN** it SHALL return `'nonexistent.key'`

### Requirement: Language preference persists in localStorage

When the user changes language via `setLanguage()`, the system SHALL write the new value to `localStorage` under the key `app-language`.

#### Scenario: Language change persists

- **WHEN** user switches language from `'en'` to `'vi'`
- **THEN** `localStorage.getItem('app-language')` SHALL return `'vi'`

#### Scenario: localStorage unavailable

- **WHEN** `localStorage` throws an error
- **THEN** the language switch SHALL still work in-memory without crashing

### Requirement: HTML lang attribute updates

The system SHALL update the `<html>` element's `lang` attribute whenever the language changes.

#### Scenario: Lang attribute reflects current language

- **WHEN** language is set to `'vi'`
- **THEN** `document.documentElement.lang` SHALL be `'vi'`

### Requirement: Translation files cover all UI strings

Translation JSON files (`en.json`, `vi.json`) SHALL contain keys for all user-visible strings in the renderer, organized by component/feature namespace (e.g., `titleBar.chats`, `settings.title`, `chat.placeholder`).

#### Scenario: All hardcoded strings are extracted

- **WHEN** searching `src/renderer/` for hardcoded English UI strings in JSX
- **THEN** all user-facing strings SHALL use `t()` calls instead of literal strings

#### Scenario: chatSuggestions remain in English

- **WHEN** language is `'vi'`
- **THEN** chat suggestions (100 items in `chatSuggestions.ts`) SHALL still display in English (translation of all 100 is out of scope for v1)
