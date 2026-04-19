# Reports

One HTML file per PR that's about to ship. Each report is the
**single artefact** a reviewer should look at to answer "is this
PR safe to merge?" — everything that matters (what changed, what
tests ran, what the perf baselines are, what's intentionally
deferred) lives in one page.

## Convention

- Filename: `YYYY-MM-DD-<slug>.html` (UTC date, spec-slug or
  feature name).
- Dark-mode default, light toggle.
- Sidebar with the panels below. If a panel has no data yet (e.g.
  Lighthouse before we ship a web UI), keep it in the layout but
  label it `not configured yet` so the reviewer isn't tricked
  into thinking a check was omitted.

## Required panels

| Panel | What goes in |
|---|---|
| **Home** | Counts: specs done / in-progress, tests, LOC by language. Comparison bar vs the last report on `main`. |
| **Changes** | `git diff --stat HEAD`: every file grouped by top-level directory with `+/-` counts and a bar. Exclude generated files (`bindings.ts`, lockfiles, binary assets). |
| **Unit & Integration** | Every passing + failing Rust test with timing and any failure message. Vitest suites here too. Failures at the top. |
| **E2E** | Only if the PR touches a feature with an E2E path. Same table shape. |
| **Perf baselines** | Boot-to-ready, RSS peak + growth, CPU avg + peak. Current run + budget + last-merged baseline for delta. |
| **Coverage** | Line-coverage gauge + per-package breakdown. `not configured yet` if the PR lands before `llvm-cov` / `c8` wiring. |
| **Security** | SAST / SCA / secrets scans. `not configured yet` as placeholder; see open TODO spec. |
| **Quality** | `cargo build --all-targets` warnings, `pnpm typecheck`, `eslint` — each as a pass/fail row. |
| **Deferred** | Known gaps the PR does **not** close, with the spec each one belongs to. Keeps a reviewer from re-asking. |

## Generating the report

Today the report is hand-written from the terminal output of the
test suite. A `scripts/generate-report.py` (or PowerShell
equivalent) is planned — it should:

1. Run `cargo test --message-format=json`, parse to test rows.
2. Run `pnpm test --reporter=json`, parse.
3. Run `cargo test --test perf_smoke -- --nocapture`, capture the
   `Report {...}` block.
4. Call `git diff --stat HEAD` for the Changes panel.
5. Load the CSS skeleton from `templates/report.html.tmpl`.
6. Emit `docs/reports/<date>-<slug>.html` and print its path.

Tracked as a follow-up to spec 0002.

## Template

Use the skeleton in `templates/report.html.tmpl` (WIP). Style is
frozen — do not reinvent colour tokens. A minimal summary of the
visual language lives in
[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) under
"PR report".
