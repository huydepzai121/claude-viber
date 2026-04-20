## [2026-04-11] Round 1 (from spx-apply fix)

### spx-verifier

- Fixed: C1 — Escape key now dismisses slash menu via `slashMenuDismissed` state instead of clearing input (`ChatInput.tsx`)

### spx-uiux-verifier

- Fixed: C2 — Added ARIA combobox pattern: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"` on textarea; `aria-label` and stable `id` attributes on listbox and options (`SlashCommandMenu.tsx`, `ChatInput.tsx`)
- Fixed: C3 — Added `aria-expanded={isExpanded}` and `aria-controls="session-info-details"` to SessionInfo toggle button, added matching `id` to expanded panel (`SessionInfo.tsx`)

### spx-arch-verifier

- Fixed: W1 — Removed double-filter redundancy: `ChatInput` now passes `filteredCommands` directly to `SlashCommandMenu`, removed `filter` prop and internal filtering from `SlashCommandMenu.tsx`

### spx-test-verifier

- Fixed: C4 — Added `slashCommandUtils.test.ts` with 18 tests covering: `getSlashFilter`, `filterCommands`, `shouldShowSlashMenu`, `buildEffectiveCommands` (including edge cases for empty input, no matches, dismissed state, fallback from sessionInitData, double-prefix prevention)

## [2026-04-11] Round 2 (from spx-apply fix)

### spx-uiux-verifier

- Fixed: Send/Stop button now has dynamic `aria-label` reflecting current state (`ChatInput.tsx`)
- Fixed: All Settings form inputs (`api-key-input`, `api-base-url-input`, `workspace-input`) now have `aria-label` attributes (`Settings.tsx`)
- Added i18n keys `chat.send` and `chat.stopStreaming` in both EN and VI
