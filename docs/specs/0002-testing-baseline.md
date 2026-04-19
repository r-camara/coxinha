# Spec 0002: Testing & reliability baseline

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
Coxinha touches user data (notes, recordings, indexes, attachments).
A regression in `storage.rs` or `db.rs` can silently corrupt a
vault. Without tests, every code-review pass is just careful
reading, which doesn't scale.

## Scope

### In — Rust unit tests
- `storage.rs`: `slug`, `extract_tags`, `first_heading`, `is_image`,
  attachment compression path
- `db.rs`: `upsert_note` round-trip, FTS5 search hits (including
  diacritic stripping), `delete_note` is idempotent, `upsert_meeting`
  round-trip, `rebuild_from_vault` produces an index identical to
  one built incrementally
- `config.rs`: TOML serialization round-trip, `update_config`
  rebuilds engines only when needed
- `summarizer.rs`: prompt formatting with and without speakers
- `recorder.rs`: start/stop state machine (double-start errors,
  metadata written, meeting row updated) — stubbed audio

### In — Rust integration tests
- End-to-end "create note → update → search → delete" via the
  `Storage` API with a temp vault
- Crash recovery: spawn a child process that starts a recording,
  `SIGKILL` it, then verify the WAV header is still valid, the
  DB `meetings` row is consistent, and the next reconcile pass
  moves `status` from `recording` → `recorded` per
  [`meeting-pipeline.md`](../architecture/meeting-pipeline.md)
- `rebuild_from_vault` after deleting `index.db` produces the
  same list of notes/meetings as before
- `transcript.json` round-trip: load a fixture written per
  [`vault-schema.md`](../architecture/vault-schema.md), re-save,
  compare byte-for-byte — catches schema drift
- Pipeline fallback matrix: missing model, missing CUDA, missing
  LLM API key each end at the state documented in
  `meeting-pipeline.md` (`failed` vs `partial`) with the
  expected `error` message

### In — Frontend unit tests (Vitest)
- Zustand store `saveNote` patches the single entry and does not
  call `list_notes`
- i18n key coverage: every `t('x.y')` in `src/**` has a matching
  key in `src/locales/en.json`

### In — UI smoke tests (Playwright + Tauri WebDriver)
Kept narrow on purpose — these are not full UI coverage, just the
path that has to keep working on every PR:
- App boots to the tray; `Ctrl+Alt+N` brings the window into focus
- Creating a note via the sidebar writes a `.md` to the temp vault
- Typing + 500ms autosave reaches disk without corrupting the file
- Opening a note from the sidebar renders the markdown back into
  the editor
- Switching between Notes / Agenda / Meetings views does not
  leak listeners (cancelled flag in `App.tsx`)

### In — CI matrix
- Ubuntu latest: `cargo fmt`, `cargo clippy`, `cargo test`, `pnpm typecheck`, UI smoke
- Windows latest: `cargo test -p coxinha`, `pnpm typecheck`, UI smoke

### Out
- Perf / load benchmarks → owned by spec 0003
- Stress / chaos testing → F2+
- Fuzzing → F2+
- Full E2E coverage of every view (beyond the smoke path) → F1.5+

## Behavior (acceptance)
- `cargo test --workspace` green on Ubuntu and Windows CI
- Every public function in `storage.rs` and `db.rs` has at least
  one test
- PR template checklist includes "tests added for changed code"
- CI fails on test failure or `clippy -D warnings`

## Design notes
- `tempfile::TempDir` for per-test vaults; the shared `Storage`
  constructor already takes the vault root as a parameter
- Use `rusqlite`'s `:memory:` for DB tests; fall back to
  `tempfile` when the test needs a file-backed journal
- Crash-recovery test invokes itself as a subprocess with a
  magic argv so the same binary is both orchestrator and target

## Open questions
- Coverage gate in CI? Start with "tests exist"; add percentage
  gates once the core is steady.
- Windows CI is slow — run on every PR or only on core changes?
  Every PR for F1 while the pipeline is fragile; dial back later.
