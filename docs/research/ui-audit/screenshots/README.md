# UI Audit Screenshots

**Date:** 2026-04-20
**Dev-server URL:** http://localhost:1420/ (Vite; the dev server was already running on port 1420 when capture started — a fresh `pnpm dev` from this subagent therefore exited with `Port 1420 is already in use`. The existing process served the audit without modification.)
**Total shots:** 15 (5 routes x 3 viewports, PNG, full-page)
**Mode:** Browser-only (no Tauri wrapper). All `window.__TAURI__.invoke` calls throw, so any data-bound view shows an empty/error state. Shell chrome (sidebar, tokens, typography, spacing) is still accurate.

## Screenshots

| Filename | Route | Viewport | Observation |
|---|---|---|---|
| empty-state-1440x900.png | / (Notes default) | 1440x900 | Initial landing = Notes view; left sidebar (brand, + New, nav, search, Recent, Tags, Settings) + empty main with "No note selected." + orange "New note (Ctrl+Alt+N)" CTA vertically centered; no hero, no onboarding |
| notes-1440x900.png | Notes (explicit click) | 1440x900 | Visually identical to empty-state; confirms Notes is the default route and its empty state |
| agenda-1440x900.png | Agenda | 1440x900 | H1 "Agenda" + sub "Today" + red error "Could not open daily note: Cannot read properties of undefined (reading 'invoke')" (expected in browser mode); sidebar collapses search/tags; Settings moves up under nav |
| meetings-1440x900.png | Meetings | 1440x900 | H1 "Meetings" + placeholder "Coming soon: history, player, transcript, summaries."; large empty canvas; no error banner |
| settings-1440x900.png | Settings | 1440x900 | H1 "Settings" + placeholder "Coming soon: engines (Whisper/Parakeet), diarization, LLM provider, shortcuts."; no form yet; sidebar shows Settings as active |
| empty-state-1024x768.png | / (Notes default) | 1024x768 | Same layout scaled down; sidebar width unchanged (~280px); CTA still centered |
| notes-1024x768.png | Notes (explicit click) | 1024x768 | Same as empty-state at 1024 |
| agenda-1024x768.png | Agenda | 1024x768 | Error banner wraps onto one line; ample empty space to right of message |
| meetings-1024x768.png | Meetings | 1024x768 | Placeholder only; no content density change |
| settings-1024x768.png | Settings | 1024x768 | Placeholder only |
| empty-state-1920x1080.png | / (Notes default) | 1920x1080 | Sidebar stays ~280px; main-area empty state reads as isolated island in vast white space — content does not grow/center adapt |
| notes-1920x1080.png | Notes (explicit click) | 1920x1080 | Same as empty-state at 1920; emphasizes lack of max-width or content-widening on large screens |
| agenda-1920x1080.png | Agenda | 1920x1080 | Error and heading hug left; huge unused white space |
| meetings-1920x1080.png | Meetings | 1920x1080 | Placeholder hugs left; huge unused white space |
| settings-1920x1080.png | Settings | 1920x1080 | Placeholder hugs left; huge unused white space |

## Console errors

All errors are the expected consequence of running in a plain browser (no `window.__TAURI__`). No network, routing, or React render errors beyond these.

- **1440x900 session:** 8 total error-level messages across the 5 routes.
- **1024x768 session:** 8 total error-level messages across the 5 routes.
- **1920x1080 session:** 8 total error-level messages across the 5 routes.

First 3 distinct error messages (verbatim, deduplicated):

1. `TypeError: Cannot read properties of undefined (reading 'invoke')` — origin: `src/lib/store.ts` `loadNotes` (App mount), `src/lib/bindings.ts` `listTags` (Sidebar mount), `src/lib/bindings.ts` `getConfig` (SettingsView mount).
2. `TypeError: Cannot read properties of undefined (reading 'transformCallback')` — origin: `@tauri-apps/api/event.js` `Module.listen` called from `src/lib/bindings.ts:346` during `App` effect setup (event subscription for backend notifications).
3. *(no third distinct error message — all remaining entries are repeats of the two above, each firing twice due to React StrictMode double-invoke of effects in dev.)*

## Routes that failed to render

None blank, none 404, none caught by an error boundary.

- **Agenda** renders an inline red error banner (`Could not open daily note: Cannot read properties of undefined (reading 'invoke')`) inside a normal page layout. The shell still draws correctly; only the daily-note fetch failed. Expected in browser-only mode.
- **Notes/Empty-state**, **Meetings**, **Settings** render their shells and placeholder copy cleanly despite the console errors from backend calls — the components tolerate missing Tauri gracefully.
