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
4. **Generate the PR report under `docs/reports/`** — see "PR report"
   below. This is mandatory; the PR template checklist references it.

## PR report

Every merge-candidate PR ships with a single HTML file under
`docs/reports/YYYY-MM-DD-<slug>.html`. It is the one artefact a
reviewer opens to decide "safe to merge?". Convention and required
panels live in [`docs/reports/README.md`](./docs/reports/README.md).

### Visual language (frozen — don't reinvent)

- **Dark default** with a light toggle (top-right button,
  state persisted to `localStorage` under `coxinha-theme`).
- **CSS variable palette** with a light/dark dual declaration in
  `:root` and `[data-theme="light"]`. Never hard-code colors
  outside that palette.
- **Accent = Coxinha orange** (`#f59e42` dark, `#d97706` light).
  Reserved for primary actions and the top-left status dot.
- **Status semantics:** green = pass / healthy, amber = pending
  or "not configured yet", red = fail / regression. Sidebar cards
  pick their left-border tint from the same trio.
- **Typography:** system sans for body, SF Mono / Consolas for
  code and metrics. No web fonts — the report must render
  offline.
- **Layout:** left sidebar with panel cards, right panel with
  sections inside cards (`--radius: 12px`, `--shadow-sm` only —
  no heavy shadows).

### Required panels (must exist even if empty)

See [`docs/reports/README.md`](./docs/reports/README.md#required-panels)
for the full list. Short version:

- **Home** — counts (specs, ADRs, tests, warnings) + comparison
  bar vs the last report.
- **Changes** — `git diff --stat HEAD` grouped by top-level
  directory. Exclude generated files and lockfiles.
- **Unit / Integ.** — every passing and failing test, failures
  first. Both Rust + Vitest.
- **Perf baselines** — boot-to-ready, RSS peak + growth, CPU avg.
  Value vs budget vs last-merged baseline.
- **Quality** — cargo/tsc/vitest warnings, build result. Each
  check a pass/fail row.
- **Deferred** — gaps this PR does *not* close, each linked to
  the spec that will close it. Stops reviewers re-proposing the
  same item next session.
- **Coverage** — gauge + per-package table, or
  `not configured yet` placeholder.
- **Security** — SAST/SCA/secrets rows, or
  `not configured yet` placeholder.

### How to produce it

Today: hand-copy from `docs/reports/2026-04-18-f1-notes-vad-obsidian.html`
as the skeleton, overwrite content. Automation is tracked as a
spec 0002 follow-up (`scripts/generate-report.py`).

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
