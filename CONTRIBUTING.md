# Contributing

Workflow, commits, and branches for Coxinha.

## Before opening a PR

1. Is there a spec under `docs/specs/` covering the change? If not,
   write it first. If the change fits an existing spec, update that
   spec's status.
2. Is it an architectural decision? Add or update an ADR under
   `docs/architecture/decisions/`.
3. First time touching a layer (Rust or frontend)? Skim
   `docs/architecture/conventions.md`.

## Branches

- `feat/<NNNN>-<slug>` — implements spec `NNNN` (e.g. `feat/0001-notes-crud`)
- `fix/<slug>` — bug fix without a new spec (e.g. `fix/shortcuts-block-on-panic`)
- `docs/<slug>` — documentation only
- `chore/<slug>` — build, deps, CI, tooling

## Commits — Conventional Commits, English imperative

Format: `<type>(<scope optional>): imperative description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`,
`perf`, `build`, `ci`.

Examples:

- `feat(notes): add create_note command`
- `fix(shortcuts): remove block_on that panicked in setup`
- `docs: reorganize docs into architecture and specs`
- `chore(deps): pin tauri-specta to 2.0.0-rc.21`

Description is imperative, lowercase, no trailing period. Body is
optional and explains the **why**, not the **what** (the diff shows
the what).

## Pull requests

- Title mirrors the main commit (same Conventional-Commits format)
- Body references the spec: `Ref: docs/specs/0001-notes.md`
- The checklist in `.github/PULL_REQUEST_TEMPLATE.md` must pass
- CI must be green before merge

## Merge

- Squash merge into `main` for a clean history
- Branch is deleted after merge
