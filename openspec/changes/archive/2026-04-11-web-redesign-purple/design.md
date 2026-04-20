## Context

Claude Agent Desktop is an Electron app (React 19 + TypeScript + Tailwind CSS 4) with a dual light/dark neutral gray theme. The renderer layer has ~20 component files using hardcoded Tailwind classes with `dark:` prefixes. All UI text is hardcoded in English. There is no i18n system or color token abstraction.

The target is a dark-only purple/violet aesthetic matching a provided screenshot, plus English/Vietnamese bilingual support.

## Goals / Non-Goals

**Goals:**

- Replace the neutral light/dark theme with a single dark purple/violet theme
- Establish CSS custom properties as the single source of truth for all colors
- Build a lightweight i18n system (React Context + JSON) for EN/VI
- Add language toggle in TitleBar and Settings
- Maintain all existing functionality — zero behavior changes

**Non-Goals:**

- Abstraction layer for Electron IPC (Phase 4, separate change)
- Adding new features or modifying chat/agent logic
- Supporting additional languages beyond EN/VI
- Light mode or theme switching capability
- Adding any new npm dependencies

## Decisions

### 1. CSS Custom Properties for Theme Tokens

**Decision**: Define all colors as CSS custom properties in `index.css`, reference via Tailwind's `var()` support.

**Why**: Single source of truth. Tailwind classes become `bg-[var(--bg-primary)]` or we extend the Tailwind theme. Future theme switching (if ever needed) becomes trivial.

**Alternative considered**: Hardcode new Tailwind color values directly in classes → rejected because it repeats the current problem of scattered color definitions.

**Token structure**:

```css
:root {
  --bg-deepest: #0d0b14;
  --bg-primary: #13111c;
  --bg-surface: #1a1528;
  --bg-elevated: #211b33;
  --bg-raised: #2a2240;

  --text-primary: #ede8f5;
  --text-secondary: #b8aed0;
  --text-muted: #8578a0;
  --text-disabled: #5c5175;

  --accent: #8b5cf6;
  --accent-hover: #a78bfa;
  --accent-active: #7c3aed;
  --accent-deep: #6d28d9;

  --border-subtle: rgba(139, 92, 246, 0.12);
  --border-medium: rgba(139, 92, 246, 0.25);
  --border-strong: rgba(139, 92, 246, 0.4);

  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}
```

### 2. Remove All Light Mode — Not Toggle

**Decision**: Strip all `dark:` prefixed classes and light-mode styles. Single theme only.

**Why**: Simplifies every component. No conditional logic. Matches the target design which is dark-only.

**Alternative considered**: Keep both modes with purple dark → rejected because it adds complexity for no user value and doesn't match the brief.

### 3. Custom i18n via React Context (No Library)

**Decision**: Build `LanguageProvider` + `useTranslation()` hook. Translations stored in `en.json` / `vi.json`.

**Why**: Only 2 languages, ~50-80 translation keys. react-i18next is overkill (adds ~40KB). Custom solution is <100 lines of code.

**Implementation**:

```
src/renderer/i18n/
├── context.tsx        — LanguageProvider, useTranslation hook
├── en.json            — English translations
└── vi.json            — Vietnamese translations
```

**Hook API**:

```typescript
const { t, language, setLanguage } = useTranslation();
// t('chat.placeholder') → "How can I help you today?"
// t('chat.placeholder') → "Tôi có thể giúp gì cho bạn?"
```

**Fallback chain**: Missing key in VI → return EN value → return raw key string.

**Persistence**: `localStorage.setItem('app-language', 'vi')`. Default: `'en'`.

### 4. Language Switcher Placement

**Decision**: Quick toggle button in TitleBar (EN/VI pill) + full selector in Settings with language name display.

**Why**: TitleBar toggle for fast switching during daily use. Settings for discoverability and showing current language clearly.

### 5. Tool Badge Color Strategy

**Decision**: Keep per-tool hue categories (green for files, amber for terminal, etc.) but adjust saturation and opacity for purple background contrast.

**Why**: Color-coding per tool type is useful UX. Just needs recalibration for the new bg.

**Approach**: Replace `dark:` variants with direct classes tuned for the purple bg. Test contrast ratios.

## Risks / Trade-offs

- **[Contrast on purple bg]** → Some tool badge colors may not meet WCAG AA on deep purple. Mitigation: verify contrast ratios during implementation, adjust individual colors as needed.
- **[Translation coverage]** → Initial release may miss some strings. Mitigation: fallback to English for any missing key — never shows empty string or key.
- **[chatSuggestions.ts has 100 strings]** → Translating all 100 is high effort. Mitigation: keep suggestions in English only for v1, or translate a subset of ~20 and randomly pick from the translated set when VI is active.
- **[No dark: prefix means no auto OS theme]** → Users who prefer light mode lose that option. Mitigation: this is an intentional design decision per the brief.
