# Coxinha — Context for Claude Code

## Invariants (not negotiable without an ADR)

- **Filesystem is canonical.** Notes/audio/attachments live under
  `~/coxinha/`; SQLite is a rebuildable index only.
- **Knowledge vs Memory.** User-authored + unambiguous-derived data
  lives in *Knowledge* (the vault files + SQLite view). AI-derived
  facts / preferences / embeddings live in *Memory* — always
  labelled as suggestion, always linked back to source, always
  dismissible. See
  [ADR-0015](./docs/architecture/decisions/0015-layered-knowledge-memory.md).
- **Windows-first.** Validate on Windows before mac/Linux.
- **Zero network in F1.** No sync, OAuth, analytics, or auto-update
  without explicit user opt-in.
- **Tray-resident.** Closing the window hides it; never re-spawn.
- **Plain Markdown.** No proprietary note schema; any Markdown editor
  must open the vault.
- **i18n + a11y from day one.** No hardcoded UI strings; every
  interactive element is keyboard reachable and screen-reader
  friendly.
- **Specs ship with tests.** A spec is `done` only when its
  acceptance criteria are covered by tests — unit, integration, or
  UI smoke as appropriate. No spec lands in `main` with a green
  acceptance checklist but an empty test file.

## Process

- A new feature is born from a written spec **before** any code.
- Architectural decisions become ADRs.
- Code, commit, and PR conventions live elsewhere — consult them when
  editing or opening a PR, not preemptively.
- Build-build-build-STOP-refactor. A file around ~400 lines? Stop and
  refactor before adding more.
