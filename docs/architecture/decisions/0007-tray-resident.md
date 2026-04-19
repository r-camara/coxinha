# ADR-0007: Tray-resident pattern

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
WebView2 cold start is ~200-400ms. Unacceptable for the
"shortcut → start typing" flow.

## Decision
The app starts with Windows (autostart plugin). The main window is
created hidden at boot. Closing the window hides it. Global
shortcuts open the pre-warmed window.

## Consequences
- **+** Perceived latency <50ms
- **+** Call detector always running in the background
- **−** Idle memory ~80MB (acceptable on machines with a GPU)
- **−** Real quit only through the tray menu
