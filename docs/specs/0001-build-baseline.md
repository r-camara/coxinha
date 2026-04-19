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
  **with default features** (no STT engines pulled in). Engines
  live behind opt-in feature flags (`stt-whisper`, `stt-parakeet`,
  `diarize-pyannote`, or the `full-release` bundle) because
  `whisper-rs-sys` runs `bindgen` at build time and requires
  `libclang` on the host — a system dep we don't impose on the
  baseline dev loop.
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
  exits 0 without editing any file (default features only)
- Fresh clone on Windows 11: `cargo check -p coxinha` exits 0 with
  stable Rust and no LLVM/libclang installed
- Builds that need an STT engine must opt in:
  `cargo build -p coxinha --features stt-whisper` (requires
  `libclang` via LLVM on the host) or `--features full-release`
  for the shipped binary
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

## CPU baseline (Handy-issue-1253 addendum)

Handy shipped a binary compiled with AVX instructions and crashed
with `STATUS_ILLEGAL_INSTRUCTION (0xc000001d)` on a Pentium Gold
G5400 — no fallback, hard crash. Prevent that here:

- Release profile in `Cargo.toml` must build against `target-cpu
  = generic` (or the cargo target default) unless a SIMD-heavy
  feature is explicitly enabled.
- Runtime CPU-feature check at startup: if the binary was built
  with AVX assumptions and the host doesn't advertise them, log
  a clear warning (not a panic) and degrade to a slower path.
  The `is_x86_feature_detected!` macro from `std::arch` covers
  the common cases without an extra crate.
- Installer spec (0017) communicates CPU requirements up front so
  users don't download an MSI that can't run.

## Open questions
- Windows CI runner takes ~6 minutes cold; acceptable for F1, but
  worth caching the Tauri side-effects once spec 0002 lands.
- Whether to bundle placeholder icons in the repo or point
  `tauri.conf.json` at absent paths — bundle, so `tauri build`
  works for anyone.

## Shipped so far
- `cargo fmt --all -- --check` gates every PR (CI `lint-rust`).
- `cargo clippy --workspace --all-targets --no-default-features
  -- -D warnings` gates every PR (PR #10). Pre-existing lints
  fixed: identical-if branches in `slug()`, `map_or(false, ..)`
  replaced by `is_some_and`, and `config.rs` helper fns moved
  above the test module.
- `pnpm typecheck` gates every PR (CI `lint-frontend`).
- All RC deps pinned via `Cargo.lock` (done in earlier PRs).

- `pnpm lint` dropped from `package.json` (PR #11). The script
  pointed at an eslint config that never existed, so every
  invocation failed. `pnpm typecheck` stays the single frontend
  gate; a proper eslint setup can land when it's actually needed.
  `eslint` remains in `devDependencies` so a follow-up can wire
  flat config without reinstalling.

Still out: Windows CI runner, CPU-feature runtime guard,
placeholder icons check, eslint flat-config (if/when needed).
