# Spec 0004: Global shortcuts

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0003 (tray-resident)
- **Relevant ADRs:** ADR-0007

## Why
Open the app and be typing a new note in <100ms without chasing a
mouse or alt-tabbing.

## Scope

### In
- Five global shortcuts registered at boot:
  - `Ctrl+Alt+N` → new note (create + focus editor)
  - `Ctrl+Alt+C` → open last used view
  - `Ctrl+Alt+A` → today's agenda (daily note)
  - `Ctrl+Alt+M` → meetings list
  - `Ctrl+Alt+R` → toggle manual recording
- Configurable via `~/coxinha/.coxinha/config.toml`
  (`ShortcutsConfig` struct)
- Conflict with another app: log a warning and move on, do not crash

### Out
- In-app shortcuts (window-focused) → handled via `KeyboardEvent`
  in the frontend, not part of this spec

## Behavior (acceptance)
- **Ctrl+Alt+N with the app in the background:** window appears,
  editor focuses, a new note is created, cursor on the title
- **Ctrl+Alt+N with the app visible:** identical behavior (reentrant)
- **Invalid shortcut in the config** (e.g. `Ctrl+Frankenstein`):
  log warning, shortcut simply does not register, others still work
- **Shortcut already taken** (e.g. another app owns `Ctrl+Alt+N`):
  log warning, do not crash startup
- **Config changed while the app is running:** takes effect on next
  restart. Runtime re-registration is F1.5+

## Design notes
- `src-tauri/src/shortcuts.rs`: `register_all` + `handle_shortcut`
- The handler emits a `navigate` event with a route
- Frontend `App.tsx` listens and routes (`/notes/new`, `/agenda`, ...)
- **Known bug:** `register_all` calls `block_on` inside `setup`,
  which is already on the tokio runtime → panic. Fix: pass the
  config directly, not `Arc<Mutex<AppState>>`.

## Open questions
- Shortcut colliding with a Windows system combo (e.g., `Ctrl+Alt+Del`):
  silent failure OK, or tray feedback?
- Configure from the UI (settings page) or TOML only for now?
