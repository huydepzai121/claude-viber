## 2026-04-11 Round 1 (from spx-apply verify fixes)

### spx-verifier

- Fixed: C1 — Chat.tsx attachment error string now uses `t('attachments.tooLarge', {...})` with interpolation params instead of hardcoded English. Added `tooLarge` and `workspaceFallback` keys to both en.json and vi.json. Updated `t()` in context.tsx to support `{param}` interpolation.
- Fixed: W1 — TitleBar language toggle aria-label now uses `t('titleBar.switchToVietnamese')` / `t('titleBar.switchToEnglish')` instead of hardcoded English.
- Fixed: W2 — AttachmentPreviewList now imports `useTranslation` and uses `t('attachments.remove')` in aria-label.

### spx-uiux-verifier

- Fixed: C2 — Added `focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none` to all interactive buttons: TitleBar (history, new chat, language toggle), ChatInput (model pills, send button), ChatHistoryDrawer (close, new chat, delete, conversation items), Settings (back, clear key, save API key, save workspace, language selectors, debug accordion), UpdateNotification (download, dismiss), UpdateReadyBanner (install).
- Fixed: C3 — Conversation list items in ChatHistoryDrawer now have `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space activation.

### spx-arch-verifier

- Fixed: W3 — Scrollbar styles in index.css now use `var(--border-medium)` and `var(--border-strong)` instead of raw `rgba(139, 92, 246, ...)` values.

## 2026-04-11 Round 2 (from spx-apply verify fixes)

### spx-uiux-verifier

- Fixed: W1 — Settings Save Workspace button (line 415) now has `focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none`.
- Fixed: W2 — AttachmentPreviewList remove button (line 102) now has `focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none`.
