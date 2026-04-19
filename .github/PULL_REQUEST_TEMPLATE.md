## What

<!-- What does this PR do? 1-2 sentences. -->

## Why

<!-- Context: what problem it solves or what feature it adds. -->

## How to test

<!-- Steps for reviewers to validate. -->

## Report

<!-- Link the HTML report added under docs/reports/ for this PR. -->

Report: `docs/reports/YYYY-MM-DD-<slug>.html`

## Checklist

- [ ] `cargo fmt --all`
- [ ] `cargo clippy --workspace --all-targets`
- [ ] `cargo test --workspace`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `cargo test -p coxinha --no-default-features --test perf_smoke -- --nocapture` (perf budgets green)
- [ ] New feature: does a spec exist under `docs/specs/`?
- [ ] Architectural change: did I add or update an ADR under `docs/architecture/decisions/`?
- [ ] Broke the IPC API: did I run `pnpm tauri dev` to regenerate `bindings.ts`?
- [ ] **Report under `docs/reports/` generated and linked above** (panels per `CONTRIBUTING.md` — Home, Changes, Tests, Perf, Quality, Deferred, Coverage, Security)
