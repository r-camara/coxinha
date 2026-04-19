# Spec 0006: App shell — tray + auto-launch + global shortcuts

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0005 (notes)
- **Relevant ADRs:** ADR-0007 (tray-resident)

## Why
The whole "keyboard shortcut → typing in <50ms" promise depends on
the app being in the tray at boot, the main window pre-warmed, and
the five global shortcuts already registered. Closing the window
has to hide it, never quit. All of this is shell infrastructure —
one spec because none of the pieces ship alone.

## Scope

### In
- App starts with Windows via `tauri-plugin-autostart` (HKCU
  registry; `LaunchAgent` on macOS for later)
- System tray icon with menu: Open, New note, Settings, Quit
- Main window created **hidden** at boot (`visible: false` in
  `tauri.conf.json`)
- `CloseRequested` → `window.hide()` + `api.prevent_close()`
- Real quit only via the tray "Quit" item or `app.exit()`
- Left click on the tray = `show + focus + unminimize` (shared
  `window::show_main` helper, already in place)
- Five global shortcuts registered at boot from `ShortcutsConfig`:
  - `Ctrl+Alt+N` → new note (create + focus editor)
  - `Ctrl+Alt+C` → open last view
  - `Ctrl+Alt+A` → today's daily (agenda)
  - `Ctrl+Alt+M` → meetings list
  - `Ctrl+Alt+R` → toggle manual recording
- Shortcut registration takes `&ShortcutsConfig` directly (no
  `block_on` inside Tauri `setup`); routing uses a
  `HashMap<Shortcut, &'static str>` — no Debug-string matching
- Unknown/invalid/conflicting shortcut: log a warning, keep the
  rest running

### Out
- Settings UI that lets the user rebind shortcuts at runtime →
  spec 0010 (re-registration in-process is still F1.5+)
- In-app keyboard shortcuts (while window focused) — handled by
  the frontend with native `KeyboardEvent`

## Behavior (acceptance)
- **First boot:** app in the tray, no visible window, ~<150MB
  RSS (measured by spec 0003 benchmarks)
- **Tray click:** window appears in <100ms, focused
- **Close button (X):** window hides, process persists; reopening
  via tray restores the prior state (the open note stays open)
- **Auto-launch:** toggle in Settings → logoff/login → app
  launches hidden
- **Quit from tray:** process terminates; next login does not
  relaunch the app
- **Ctrl+Alt+N in the background:** window appears, editor
  focuses, a new note is created, cursor in the heading
- **Ctrl+Alt+N visible:** identical behavior (reentrant)
- **Invalid shortcut in config** (`Ctrl+Frankenstein`): log
  warn, skip only that binding, others work
- **Conflicting shortcut** (another app owns it): log warn, skip,
  don't crash startup

## Design notes
- Code in place post-refactor: `src-tauri/src/shortcuts.rs`
  (HashMap routing), `src-tauri/src/tray.rs`, `src-tauri/src/window.rs`,
  `src-tauri/src/lib.rs` setup flow
- The Tauri plugin registers handlers; `shortcuts::handle_shortcut`
  emits `navigate` events with route strings
- Dev-only flag to disable auto-launch so each test session
  doesn't register the app — opt-in from Settings (spec 0010)

## Open questions
- Windows tray icon colored (not `iconAsTemplate`); macOS prefers
  template. Handle per-OS when icons land.
- What happens if the user uninstalls while Coxinha is autostarted?
  Rely on the tauri-plugin-autostart uninstall hook.
