# Spec 0003: Tray-resident + auto-launch

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0007

## Why
WebView2 cold start costs 200-400ms. For the "shortcut → type"
flow we need a pre-warmed window always ready.

## Scope

### In
- Starts with Windows via `tauri-plugin-autostart`
- System tray icon with menu (Open, New note, Settings, Quit)
- Main window created **hidden** at boot
- `CloseRequested` → `window.hide()` + `api.prevent_close()`
- Real quit only from the "Quit" tray item or `app.exit()`
- Left click on the tray = `show + focus + unminimize` main window

### Out
- Global shortcuts → spec 0004
- Call-detected toast → spec 0005

## Behavior (acceptance)
- **First boot:** app appears in the tray, no visible window.
  `tasklist` shows `coxinha.exe` using <150MB.
- **Tray click:** window appears in <100ms, focused, editor ready
- **Close button (X):** window hides, process keeps running.
  Reopening via tray restores the prior state (the open note stays open)
- **Auto-launch:** toggle in Settings → logoff/login → app launches
  silently (hidden)
- **Quit from tray:** process terminates; next login does not start
  the app until the user opens it manually

## Design notes
- `src-tauri/src/lib.rs`: `on_window_event` intercepts
  `CloseRequested`; `setup` calls `tray::setup`
- `src-tauri/src/tray.rs`: menu + handlers
- `tauri.conf.json`: `windows[0].visible: false`, `trayIcon` set
- Plugin: `tauri-plugin-autostart` with `LaunchAgent` on macOS and
  HKCU registry on Windows

## Open questions
- Dev flag to disable auto-launch (so the app doesn't start every
  test session). Suggestion: only enable when the user opts in from
  Settings.
- Windows tray icon may need a colored version
  (not `iconAsTemplate`)
