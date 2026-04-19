# Coxinha — Context for Claude Code

## Invariants (not negotiable without an ADR)

- **Filesystem is canonical.** Notes/audio/attachments live under
  `~/coxinha/`; SQLite is a rebuildable index only.
- **Windows-first.** Validate on Windows before mac/Linux.
- **Zero network in F1.** No sync, OAuth, analytics, or auto-update
  without explicit user opt-in.
- **Tray-resident.** Closing the window hides it; never re-spawn.
- **Plain Markdown.** No proprietary note schema; any Markdown editor
  must open the vault.
- **i18n + a11y from day one.** No hardcoded UI strings; every
  interactive element is keyboard reachable and screen-reader
  friendly.

## Process

- A new feature is born from a written spec **before** any code.
- Architectural decisions become ADRs.
- Code, commit, and PR conventions live elsewhere — consult them when
  editing or opening a PR, not preemptively.
- Build-build-build-STOP-refactor. A file around ~400 lines? Stop and
  refactor before adding more.
