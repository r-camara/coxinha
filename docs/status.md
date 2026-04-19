# Skeleton status

This skeleton is a starting point. Not everything compiles out of
the box — some files are explicit stubs, and optional features
depend on external crates.

## ✅ Actually implemented

- **Full documentation** — README, architecture/overview, 11 ADRs, 32 specs, roadmap, CLAUDE.md
- **Cargo workspace** configured (`src-tauri` + `shared`)
- **Shared types** (`shared/src/lib.rs`) with `specta::Type` for IPC
- **Tauri commands** (`lib.rs`) defining the full F1 API
- **SQLite + FTS5 DB** (`db.rs`) working
- **Filesystem storage** (`storage.rs`) with backend WebP compression
- **Basic tray + shortcuts + config**
- **React frontend** with BlockNote, client-side WebP compression, Zustand store
- **GitHub Actions** CI + release
- **Scripts** for model download and WSL setup

## ⚠️ Stubs that need real code

These files have explicit `TODO`s — the scaffold is there, the
implementation is missing:

- **`recorder.rs`** — real cpal + wasapi capture (only the start/stop
  scaffold exists; no audio is actually recorded yet)
- **`call_detector.rs`** — COM enumeration via the `windows` crate
  (`poll_active_calls` returns an empty vec)
- **`diarizer/pyannote.rs`** — real call into `pyannote-rs` (today
  it returns segments without speaker labels)
- **`transcribe_meeting` command** — needs to wire recorder →
  transcriber → diarizer → save `transcript.json`

## ❓ Might need adjustment

- **`transcriber/parakeet.rs`** — the `transcribe-rs 0.3` API was
  used per public docs, but `result.segments` and `result.language`
  fields may differ. Validate with `cargo check --features stt-parakeet`.
- **`tauri-specta 2.0.0-rc`** — RC version, API may have moved since
  generation. If `cargo build` complains, pin an exact `=2.0.0-rc.X`.
- **`capabilities/default.json`** — minimal permissions. Add as you
  use more Tauri APIs.
- **`icons/`** — only a README. Generate real icons:
  ```bash
  pnpm tauri icon assets/coxinha.png
  ```

## 🚧 Not there yet

- `eslint.config.js` (referenced by `pnpm lint`). Create one or drop
  the script from `package.json`.
- Tests — none yet. F1 should at least include smoke tests in
  `db.rs` and `storage.rs`.
- `src/components/MeetingsList.tsx`, `Agenda.tsx`,
  `CallDetectedToast.tsx` — `App.tsx` has inline placeholders only.
- Formal DB migrations (today it's inline SQL in `Db::migrate`).

## Recommended first run

1. Put icons in `src-tauri/icons/` (or temporarily comment
   `bundle.icon` in `tauri.conf.json`)
2. `pnpm install`
3. `./scripts/download-models.sh` (Whisper base + pyannote, ~300MB)
4. `pnpm tauri dev`

If it fails, 90% of the time it's in an optional crate (parakeet,
pyannote). Comment the matching feature in `src-tauri/Cargo.toml`
to isolate.

## Vibe coding with Claude Code

The project has a short `CLAUDE.md` with invariants and process.
Start from the repo root:

```bash
cd coxinha
claude
```

Claude will find `CLAUDE.md` automatically and pull in docs as
tasks demand. Suggested first prompt:

> "Read the project docs and tell me the most impactful TODO to
> attack. Propose the next 3-5 PRs."
