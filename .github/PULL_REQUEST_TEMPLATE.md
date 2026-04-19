## What

<!-- What does this PR do? 1-2 sentences. -->

## Why

<!-- Context: what problem it solves or what feature it adds. -->

## How to test

<!-- Steps for reviewers to validate. -->

## Checklist

- [ ] `cargo fmt --all`
- [ ] `cargo clippy --workspace --all-targets`
- [ ] `cargo test --workspace`
- [ ] `pnpm typecheck`
- [ ] New feature: does a spec exist under `docs/specs/`?
- [ ] Architectural change: did I add or update an ADR under `docs/architecture/decisions/`?
- [ ] Broke the IPC API: did I run `pnpm tauri dev` to regenerate `bindings.ts`?
