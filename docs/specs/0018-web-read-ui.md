# Spec 0018: Read-mostly web UI

- **Status:** draft
- **Phase:** F2
- **Owner:** Rodolfo
- **Depends on:** spec 0015
- **Relevant ADRs:** —

## Why
Check the vault from any machine (Chromebook, a locked-down work
PC) without installing the app.

## Scope

### In
- Web frontend served by the same backend (Axum + static files)
- Login via spec 0019
- Read: list notes, open, search, read meetings/summaries
- Lightweight edit: plain text only, no full BlockNote

### Out
- Recording / transcription over the web → stays desktop-only
- Mobile PWA install → F5

## Behavior (acceptance)
- Login → vault visible; a small edit persists and appears on desktop
