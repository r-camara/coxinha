# Spec 0002: Testing & reliability baseline

- **Status:** done (core baseline — see "Shipped" below; perf +
  CI Windows matrix rolling in as follow-ups under their own
  specs)
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

## Shipped (as of 2026-04-18)

- **44 Rust unit tests** covering `storage` (slug, tags, heading,
  sanitize, atomic-write, create/update/delete, daily-note
  idempotency), `db` (roundtrip, sort, delete, FTS match,
  idempotent upsert, schema-open idempotence), `config`
  (`default_config_builds_all_engines` regression guard for the
  Whisper-panic bug), `obsidian` (parse, sort, existence, empty,
  malformed), `transcriber` (noop fallback), `audio_toolkit::vad`
  (Silero load + silence classification + frame-size validation;
  `SmoothedVad` window, flip, decay, reset).
- **1 boot integration test** (`tests/boot_smoke.rs`) that spawns
  `coxinha.exe`, reads stdout/stderr over threads, waits for
  `Coxinha ready`. Catches the four plugin/config drift failures
  that pure-function tests couldn't (see
  [`lessons.md`](../lessons.md) 2026-04-18 postmortem).
- **1 perf integration test** (`tests/perf_smoke.rs`) using
  `sysinfo` — samples RSS + CPU at 100 ms over a 5 s idle window
  after ready. Budgets: peak RSS < 200 MB, avg CPU < 25 %,
  idle-window growth < 30 MB. Current baseline ~38 MB RSS,
  0 % CPU, ~0 MB growth.
- **22 frontend tests (Vitest)**: i18n catalog key coverage,
  `sortByUpdated` purity, `theme` helpers (apply, follow, cleanup,
  flips on OS change), `SettingsView` (empty state, dirty track,
  save path, load error), `Sidebar` (recents, debounce, no
  results, clear button, whitespace no-op).
- `pnpm typecheck` clean; `cargo build` zero warnings.

## Still open (explicit carve-outs)

- **Crash-recovery integration test** (SIGKILL during recording)
  belongs to spec 0007 when the recorder is real. The perf smoke
  harness is the template.
- **`rebuild_from_vault` round-trip test** waits on that command
  existing — spec 0004.
- **CI Windows runner** — local Windows validation works, but
  `.github/workflows/ci.yml` still needs a `windows-latest` job
  running `cargo test -p coxinha --no-default-features` and
  `pnpm test`. Tracked in spec 0001.
- **UI smoke (Playwright + Tauri WebDriver)** — deferred past
  F1. Current Vitest coverage of components is meaningful
  without a browser-driver harness.
- **Coverage percentage gate** — not now; we have "tests exist"
  as the gate.

## Open questions
- When do we add an endurance test (hours-long synthetic
  recording + transcription) to catch slow leaks per spec 0007
  RSS budget? Probably right after the recorder lands.
