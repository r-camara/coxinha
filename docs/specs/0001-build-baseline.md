# Spec 0001: Build & dependency baseline

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
Every other F1 spec depends on the project compiling on a clean
machine with a current toolchain, and on RC/unstable dependencies
being pinned to specific versions. Until that is true, features
land on sand.

## Scope

### In
- `rustup update stable` pushes the toolchain to the 1.88+ floor
  required by Tauri 2 + image + whisper-rs (see `docs/lessons.md`)
- `cargo check --workspace` passes on Ubuntu and Windows CI runners
- `pnpm install --frozen-lockfile && pnpm typecheck` passes
- **Pin exact versions** of the RC/unstable crates — substitute a
  compiling version for each and lock it:
  - `tauri-specta`
  - `specta-typescript`
  - `ort` (transitive via `transcribe-rs`)
  - `transcribe-rs`
  - `pyannote-rs`
- Placeholder icons in `src-tauri/icons/` (or temporarily comment
  `bundle.icon` in `tauri.conf.json` until real art lands)
- `eslint.config.js` created **or** the `lint` script dropped from
  `package.json` — whichever lets `pnpm typecheck` stay the only
  frontend gate
- CI workflow actually runs on every PR for both Ubuntu and Windows

### Out
- Feature implementation (every other F1 spec)
- Performance tuning (spec 0003)
- Testing coverage expansion (spec 0002)

## Behavior (acceptance)
- Fresh clone on Ubuntu: `rustup update && cargo check --workspace`
  exits 0 without editing any file
- Fresh clone on Windows 11: `cargo check -p coxinha` exits 0 with
  stable Rust
- PR that changes nothing still sees green GitHub Actions on both
  OS matrix entries
- `Cargo.lock` gets committed and doesn't drift between CI and
  local builds

## Design notes
- Pinning strategy: exact `=X.Y.Z-rc.N` for RC tracks; regular
  `X.Y` for stable crates. Document the pinned versions in the
  PR description so the next bump is deliberate.
- If a crate's API has moved beyond what the skeleton expected
  (likely for `tauri-specta`, `transcribe-rs`, `pyannote-rs`),
  fix the call site in the same PR rather than stacking work.

## Open questions
- Windows CI runner takes ~6 minutes cold; acceptable for F1, but
  worth caching the Tauri side-effects once spec 0002 lands.
- Whether to bundle placeholder icons in the repo or point
  `tauri.conf.json` at absent paths — bundle, so `tauri build`
  works for anyone.
