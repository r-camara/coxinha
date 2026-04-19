# Skeleton status

This skeleton is a starting point. Not everything compiles out of
the box — some files are explicit stubs, and optional features
depend on external crates.

## ⭐ The critical path — this IS the product

Coxinha without the meeting loop is a slower Obsidian. The four
items below are the whole differentiator; everything else in F1
is packaging around them:

- `recorder.rs` — mic + WASAPI system loopback, mixed into a
  16kHz mono WAV. Today only the start/stop scaffold exists; no
  audio is actually captured.
- `call_detector.rs` — `poll_active_calls` still returns an empty
  vec. Needs real `IAudioSessionManager2` enumeration via the
  `windows` crate.
- `diarizer/pyannote.rs` — returns segments without speaker labels
  and logs a warning. Pipeline is stubbed.
- `transcribe_meeting` — the command currently returns
  `Err("not wired yet (see spec 0007)")`. The chain recorder →
  transcriber → diarizer → write `transcript.json` → flip
  `has_transcript` must be glued together.

Until this chain runs end-to-end, every other F1 task is
secondary.

## ✅ Actually implemented

- **Full documentation** — README (with pitch), architecture/overview,
  13 ADRs, 34 specs, roadmap, CLAUDE.md
- **Cargo workspace** configured (`src-tauri` + `shared`)
- **Shared types** (`shared/src/lib.rs`) with `specta::Type` and
  `PartialEq/Eq` for IPC and config diffing
- **Tauri commands** (`lib.rs`) defining the full F1 API
- **SQLite + FTS5 DB** (`db.rs`) working
- **Filesystem storage** (`storage.rs`) with backend WebP
  compression
- **Tray + global shortcuts + config** baseline
- **React frontend** with BlockNote, client-side WebP compression,
  Zustand store that patches locally instead of re-fetching on save
- **i18n** wired end-to-end (`react-i18next` + `rust-i18n`); OS
  locale detection + fallback to `en`
- **Accessibility** baseline: semantic HTML, `aria-label`,
  focus-visible, `role="status"` on loading states
- **GitHub Actions** CI + release
- **Scripts** for model download and WSL setup

## ❓ Needs pinning before F1 ships

All the dependencies below are on RC tracks or were added under
imperfect knowledge of their real API. Spec 0038 (testing
baseline) + a one-time `cargo check --workspace` pass will surface
whatever broke; pin the exact version next to any fix.

- **`tauri-specta 2.0.0-rc`** + **`specta-typescript 0.0.9`** —
  RC versions, API may have moved since generation. Expect to pin
  `=2.0.0-rc.X` once something compiles green.
- **`ort 2.0.0-rc`** (pulled transitively via `transcribe-rs`) —
  still RC; breaking changes likely.
- **`transcribe-rs 0.3`** — Parakeet impl uses `ParakeetModel::load`,
  `ParakeetParams`, `set_ort_accelerator` per public docs, but
  `result.segments` / `result.language` field names may differ.
- **`pyannote-rs 0.3`** — latest on crates.io may actually be
  `0.2.x`; confirm and pin exactly.
- **`capabilities/default.json`** — minimal permissions. Add as
  you use more Tauri APIs.
- **`icons/`** — only a README. Generate real icons:
  ```bash
  pnpm tauri icon assets/coxinha.png
  ```

## 🚧 Not there yet

- `eslint.config.js` (referenced by `pnpm lint`). Create one or
  drop the script from `package.json`.
- Tests — none yet. Tracked in spec 0038.
- `src/components/MeetingsList.tsx`, `Agenda.tsx`,
  `CallDetectedToast.tsx`, `Settings.tsx` — `App.tsx` has inline
  placeholders only. Tracked in specs 0035 (meetings list), 0036
  (settings view); agenda + call toast are in specs 0002 and 0005.
- Formal DB migrations (today it's inline SQL in `Db::migrate`).
  Tracked in spec 0041.
- Installer + first-run onboarding — tracked in spec 0040.
- Vault import / backup / external-edit handling — tracked in
  specs 0037, 0039, 0042 (all F1.5).

## Recommended first run

1. `rustup update stable` (floor is 1.88 thanks to Tauri 2 + image
   + whisper-rs)
2. Put icons in `src-tauri/icons/` (or temporarily comment
   `bundle.icon` in `tauri.conf.json`)
3. `pnpm install`
4. `./scripts/download-models.sh` (Whisper base + pyannote, ~300MB)
5. `pnpm tauri dev`

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

> "Read the project docs and tell me the most impactful TODO on
> the critical path. Propose the next 3-5 PRs."
