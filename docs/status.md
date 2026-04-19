# Skeleton status

This skeleton is a starting point. Not everything compiles out of
the box — some files are explicit stubs, and optional features
depend on external crates.

## ⭐ The critical path — this IS the product

Coxinha without the meeting loop is a slower Obsidian. The four
items below are the whole differentiator; everything else is
packaging around them:

- `recorder.rs` — mic + WASAPI system loopback, mixed into a
  16kHz mono WAV. Today only the start/stop scaffold exists; no
  audio is actually captured. (Spec 0007.)
- `call_detector.rs` — `poll_active_calls` still returns an empty
  vec. Needs real `IAudioSessionManager2` enumeration via the
  `windows` crate. (Spec 0007.)
- `diarizer/pyannote.rs` — returns segments without speaker labels
  and logs a warning. Pipeline is stubbed. (Spec 0008.)
- `transcribe_meeting` — the command currently returns
  `Err("not wired yet (see spec 0008)")`. The chain recorder →
  transcriber → diarizer → write `transcript.json` → flip
  `has_transcript` must be glued together. (Spec 0008.)

The on-disk contracts and failure semantics are already frozen:

- [`architecture/vault-schema.md`](./architecture/vault-schema.md) —
  JSON/markdown schemas for `metadata.json`, `transcript.json`,
  `summary.md`, and the note ↔ meeting link rule (UUID in
  frontmatter, no wiki-links to meetings in F1).
- [`architecture/meeting-pipeline.md`](./architecture/meeting-pipeline.md) —
  state machine (`recording → recorded → transcribing → …
  → ready`), engine defaults (Whisper base on CPU, `NoneDiarizer`,
  Ollama `llama3.2:3b`), retry policy, and the fallback matrix.

## ✅ Actually implemented

- **Full documentation** — README, architecture overview +
  `vault-schema.md` + `meeting-pipeline.md`, **14 ADRs**, **38
  specs**, roadmap, CLAUDE.md, lessons (+ postmortem for the
  four boot-failure class)
- **Cargo workspace** configured (`src-tauri` + `shared`)
- **Shared types** (`shared/src/lib.rs`) with `specta::Type` and
  `PartialEq/Eq` for IPC and config diffing; `TranscriberConfig`
  gained a safe `None` default + `NoopTranscriber` fallback so
  a fresh install never panics on a missing engine
- **Tauri commands** (`lib.rs`) defining the full F1 API plus
  `list_obsidian_vaults` (spec 0037) and
  `get_or_create_daily_note` (spec 0005)
- **SQLite + FTS5 DB** (`db.rs`) working, with `get_note_by_path`
  for the daily-note probe
- **Filesystem storage** (`storage.rs`) with backend WebP
  compression, TOCTOU-free delete, `update_note` returns the
  refreshed Note, **atomic writes** (`.coxinha-tmp` + rename)
  for every on-disk mutation
- **Daily notes**: `~/coxinha/daily/YYYY-MM-DD.md` template,
  path-probe idempotency, Agenda view renders today's daily on
  mount
- **Wiki-links** (`[[target]]` / `[[target|alias]]`): parsed on
  every note save, stored in `links` table, backlinks panel on
  the right of the editor (spec 0013)
- **Tags filter** (spec 0014): sidebar tag cloud with counts
  from `json_each(tags_json)`, click a pill to filter the note
  list, `aria-pressed` on the active pill; autocomplete on `#`
  deferred to a future spec
- **Obsidian vault detection** (Windows): `obsidian.json` parsed,
  surfaced in Settings with radio-pick + custom-path input;
  Save updates `vault_path` (restart still required for
  re-index — spec 0004)
- **Tray + global shortcuts + config** baseline (no `block_on`
  inside Tauri `setup`; HashMap-based shortcut routing); JSON
  `app.trayIcon` removed so only the programmatic tray survives;
  stale `plugins.autostart` block removed
- **`default = []` feature set** — STT engines opt-in
  (`stt-whisper`, `stt-parakeet`, `full-release`); no libclang
  needed for the default dev loop
- **React frontend** with BlockNote, client-side WebP
  compression, Zustand store that patches locally instead of
  re-fetching on save; sidebar live search with 150 ms debounce;
  new-note shortcut creates an empty note and drops the cursor
  in the body
- **Dark mode + shadcn tokens**: full token palette
  (`--card`, `--popover`, `--secondary`, `--destructive`,
  `--input`, `--ring`, `--radius`) plus coxinha orange as
  `--primary`; Tailwind aliases so `bg-background`, `text-muted`,
  `border-border`, etc. resolve; Settings &gt; Appearance
  exposes an Auto/Light/Dark preference stored in
  `localStorage`, with Auto following `prefers-color-scheme`
  live (spec 0010)
- **Icon set** generated from `assets/icon2.png` via
  `scripts/generate-icons.ps1` (32/128/128@2x/icon.png +
  256×256 PNG-in-ICO)
- **i18n** wired end-to-end (`react-i18next` + `rust-i18n`); OS
  locale detection + fallback to `en`
- **Accessibility** baseline: semantic HTML, `aria-label`,
  focus-visible, `role="status"` on loading states
- **Audio toolkit** (port from Handy — ADR-0014): Silero VAD v5
  embedded model, `SmoothedVad` 15-frame window; kickoff for
  spec 0007 recording
- **GitHub Actions** CI + release — `cargo fmt`, `cargo clippy
  --no-default-features -D warnings`, and `pnpm typecheck` all
  gate PRs on Ubuntu; Windows runner job still to wire (spec
  0001)
- **Scripts** for model download, icon generation, WSL setup

## 🧪 Test suite

- **Rust: 71 tests** — 69 unit (storage, db, config, obsidian,
  transcriber, VAD smoothed + silero, wiki-link extractor,
  backlinks query, tag aggregation) + 1 boot smoke + 1 perf smoke
- **Frontend: 44 tests** — locale catalog, `sortByUpdated`,
  theme helpers (incl. Auto/Light/Dark preference), `SettingsView`
  (Vault + Appearance + Shortcuts read-only), `Sidebar` (search +
  tags), `BacklinksPanel`
- **Baselines today**: boot ~800 ms, idle RSS ~38 MB, idle CPU
  0 %, idle growth ~0 MB, vitest suite ~3 s

## ❓ Needs pinning before F1 ships

All the dependencies below are on RC tracks or were added under
imperfect knowledge of their real API. Spec 0001 (build & dep
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
  drop the script from `package.json` (handled by spec 0001).
- `src/components/MeetingsList.tsx` and `CallDetectedToast.tsx`
  (specs 0009 / 0007). Agenda ✓, Settings ✓ (Vault panel only
  so far; full Settings UI is spec 0010).
- Formal DB migrations (today it's inline SQL in `Db::migrate`
  with `IF NOT EXISTS`). Tracked in spec 0004.
- Installer + first-run onboarding — spec 0017, with
  "test microphone" step added post-Handy issues review.
- Vault adopt-and-re-index: detection + Save ✓, but the actual
  re-bootstrap / rebuild from disk needs spec 0004 first.
- Vault import / backup / external-edit handling — specs 0015,
  0016, 0018 (all F1.5).
- CI Windows runner step for `cargo test` + `pnpm test` — the
  workflow exists but Windows job still missing (spec 0001).

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
