## 1. Theme Foundation

- [x] 1.1 Define CSS custom properties in `src/renderer/index.css` — all color tokens (backgrounds, text, accents, borders, status colors) under `:root`
- [x] 1.2 Remove all `@media (prefers-color-scheme: dark)` blocks from `index.css`
- [x] 1.3 Remove all light-mode scrollbar styles, keep only dark purple scrollbar styles
- [x] 1.4 Update `.tool-container` and `.expanded-block-section` styles to use theme tokens ← (verify: index.css has zero `prefers-color-scheme` queries, all tokens defined)

## 2. i18n System

- [x] 2.1 Create `src/renderer/i18n/en.json` with all UI string keys organized by component namespace
- [x] 2.2 Create `src/renderer/i18n/vi.json` with Vietnamese translations for all keys
- [x] 2.3 Create `src/renderer/i18n/context.tsx` — LanguageProvider, useTranslation hook, localStorage persistence, HTML lang attribute update, fallback chain
- [x] 2.4 Wrap App in LanguageProvider in `src/renderer/App.tsx` ← (verify: useTranslation hook works, fallback chain correct, localStorage persistence works)

## 3. TitleBar Redesign

- [x] 3.1 Replace TitleBar colors: remove all `bg-white`/`dark:` classes, apply `--bg-deepest` bg with backdrop-blur, `--border-subtle` border, `--text-primary` text
- [x] 3.2 Update TitleBar buttons (Chats, New) to use `--bg-elevated` bg, `--border-subtle` border, accent hover
- [x] 3.3 Add language quick-toggle pill button (EN/VI) to TitleBar actions
- [x] 3.4 Replace hardcoded English strings with `t()` calls ← (verify: TitleBar renders with purple theme, language toggle cycles EN↔VI)

## 4. ChatInput Redesign

- [x] 4.1 Replace ChatInput container colors: `--bg-surface` bg, `--border-medium` ring, remove all `dark:` classes
- [x] 4.2 Update textarea placeholder and text to use `--text-muted` and `--text-primary`
- [x] 4.3 Update attachment button to use `--bg-elevated` bg, `--border-subtle` border
- [x] 4.4 Update model pill switcher (Fast/Smart/Sonnet/Opus) to use theme tokens — active pill uses accent colors
- [x] 4.5 Update send button: `--accent` bg for default, `--bg-elevated` for stop state
- [x] 4.6 Replace hardcoded strings with `t()` calls ← (verify: ChatInput fully themed, all interactive states correct)

## 5. MessageList & Message Redesign

- [x] 5.1 Update MessageList container: remove `bg-white`/`dark:bg-neutral-900`, use `--bg-primary`
- [x] 5.2 Update empty state card: `--bg-surface` bg, `--border-subtle` border, `--text-muted`/`--text-primary` text
- [x] 5.3 Update user message bubble: `--bg-raised` bg, `--border-medium` border
- [x] 5.4 Update assistant message prose: ensure `prose-invert` with `--text-primary` color
- [x] 5.5 Update streaming indicator text to `--text-muted`
- [x] 5.6 Replace hardcoded strings with `t()` calls ← (verify: messages display correctly, empty state themed, prose readable)

## 6. ChatHistoryDrawer Redesign

- [x] 6.1 Replace drawer panel colors: `--bg-deepest` with backdrop-blur, `--border-subtle` borders
- [x] 6.2 Update conversation cards: `--bg-surface` default, `--bg-raised` active, accent border on active
- [x] 6.3 Update close button, new chat button, delete button to theme tokens
- [x] 6.4 Update empty state icon and text to theme tokens
- [x] 6.5 Replace hardcoded strings with `t()` calls ← (verify: drawer opens/closes with correct theme, conversation list readable)

## 7. Settings Page Redesign

- [x] 7.1 Replace Settings page background: `--bg-primary`, remove gradient light classes
- [x] 7.2 Update main card: `--bg-surface` bg, `--border-subtle` border
- [x] 7.3 Update all inputs: `--bg-elevated` bg, `--border-subtle` border, `--text-primary` text, accent focus ring
- [x] 7.4 Update all buttons: primary buttons use `--accent` bg, secondary use `--bg-elevated` border style
- [x] 7.5 Update toggle switch: accent color when enabled
- [x] 7.6 Update debug info section: `--bg-elevated` bg, `--border-subtle` borders
- [x] 7.7 Add Language section with EN/VI selector (between API Key and Workspace sections)
- [x] 7.8 Replace all hardcoded strings with `t()` calls ← (verify: Settings fully themed, language selector works, all sections readable)

## 8. Tool Badge Colors

- [x] 8.1 Update `toolBadgeConfig.tsx`: remove all `dark:` prefixes, recalibrate colors for purple bg contrast
- [x] 8.2 Update thinking badge config similarly
- [x] 8.3 Update `CollapsibleTool.tsx` borders and backgrounds to theme tokens ← (verify: all tool badges readable on purple bg, contrast >= 4.5:1 for text)

## 9. Remaining Components

- [x] 9.1 Update `BlockGroup.tsx`: replace `dark:` classes with theme tokens
- [x] 9.2 Update `Markdown.tsx`: ensure prose theme works on purple bg
- [x] 9.3 Update `AttachmentPreviewList.tsx`: theme tokens for borders and backgrounds
- [x] 9.4 Update `UpdateNotification.tsx`, `UpdateReadyBanner.tsx`, `UpdateCheckFeedback.tsx`: theme tokens
- [x] 9.5 Replace any remaining hardcoded strings in these components with `t()` calls ← (verify: no remaining `dark:` classes or `bg-white` in any renderer file)

## 10. Validation

- [x] 10.1 Run `bun run typecheck` — fix any TypeScript errors
- [x] 10.2 Run `bun run lint` — fix any ESLint errors
- [x] 10.3 Run `bun run test` — ensure existing tests pass
- [x] 10.4 Run `bun run format` — format all changed files ← (verify: all checks pass, zero `dark:` classes remain, zero `bg-white` remain, zero `prefers-color-scheme` remain in renderer)
