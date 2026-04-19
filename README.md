# Coxinha

> Crispy outside, tasty inside. Your local-first second brain with AI.

**Bot-less** desktop notetaker with meeting recording, transcription,
and personal memory. Runs 100% locally, works offline, tray-resident
with instant startup.

## The problem

A corporate-shaped work day is: meeting, context switch, meeting,
quick note, meeting, follow-up, meeting. Without a fast way to
capture notes and turn meetings into searchable memory, the
"second brain" stays a fantasy — raw material leaks into Slack
threads, half-notes in OneNote, and transcripts stuck inside some
SaaS you don't own.

Two problems have to be solved **together**, because solving only
one doesn't move the needle: a note-taking tool fast enough to use
mid-meeting, **and** a meeting recorder that actually feeds the
same tool.

## Editors — why the obvious choices don't fit

| Tool | Deal-breaker |
|---|---|
| Notion | Cloud-first, proprietary schema, slow cold start, vendor lock-in |
| Obsidian | Great vault, but no built-in meeting recording or AI summary — an ecosystem of plugins you assemble and maintain yourself |
| Logseq | Local and open, but block-centric UX is niche, sluggish on Windows, no meeting recorder |
| Apple Notes / OneNote | Tied to a single ecosystem, proprietary format, zero local control |
| Roam Research | Cloud-only subscription, slow, data lives on someone else's servers |
| Bear | Markdown-ish but locks you to Apple, no AI |
| VS Code + Markdown | Fast and local, but no slash menu, no backlinks UX, no image paste — a text editor, not a note tool |

## Meeting tools — same story

| Tool | Deal-breaker |
|---|---|
| Fathom | Bot joins the call (visible to everyone), cloud transcription, your audio leaves your machine |
| Granola | Bot-less, but summarization is cloud; Mac-first, Windows lags; subscription |
| Otter.ai | Everything lives in their cloud; subscription |
| Fireflies | Bot-based, cloud-only, subscription |
| Read.ai / Krisp | Cloud-first, locked to specific conferencing tools |
| MS Copilot for Teams | Only Teams, enterprise licensing, data stays in the MS 365 silo |
| Meetily | Closest match — open, local, bot-less — but young and limited; no vault of its own |
| AiNotes | Open and local, but the Python sidecar adds +200MB and is painful to bundle on Windows |

## What Coxinha is

The intersection of both problems, solved together:

- **Bot-less, local-first meeting capture** — mic + system loopback
  mixed into a 16kHz WAV, transcribed by `whisper-rs` or Parakeet,
  diarized by `pyannote-rs`. Nothing leaves the machine.
- **Notion-like editor** that opens in <50ms via tray shortcut,
  stores plain Markdown under `~/coxinha/`, and stays compatible
  with Obsidian or VS Code opening the exact same files.
- **One vault for both surfaces** — meeting summaries land as
  Markdown next to your notes, searchable by SQLite FTS5, linkable
  via wiki-links, summarized by your LLM of choice (local Ollama,
  Claude API, whatever you point it at).

Windows-first. Keyboard-first. Tray-resident. MIT-licensed.
Subscription: none.

## Features (F1 — MVP)

- ⚡ Tray-resident; `Ctrl+Alt+N` opens the app in <50ms
- 📝 Notion-like editor (BlockNote + shadcn) with image paste
- 💾 Notes stored as Markdown on disk (`~/coxinha/`)
- 🎙️ Detects active Teams/Meet/Zoom calls and offers to record
- 🎧 Records mic + system audio (WASAPI loopback)
- 🧠 Local transcription: Parakeet (ONNX) or Whisper (CUDA)
- 🗣️ Local diarization: pyannote-rs or speakrs
- 📄 Summarization via Claude, local Ollama, or other APIs

## Quick start

### Prerequisites

- Windows 11 (primary target) or macOS/Linux (experimental)
- Rust stable (1.88+) — `rustup update` if you haven't lately
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- **Dev:** WSL2 Ubuntu (recommended, Rust builds 2-3x faster)
- (Optional) CUDA Toolkit 12+ for GPU acceleration
- (Optional) Ollama running locally for offline summarization

### Development

```bash
# Clone + deps
git clone <repo>
cd coxinha
pnpm install

# Download models (Parakeet INT8 + pyannote segmentation)
./scripts/download-models.sh

# Run in dev mode (hot reload)
pnpm tauri dev
```

First Rust build takes 3-5 minutes (compiles whisper.cpp and
downloads ONNX Runtime). Incremental builds ~10s.

### Release build

```bash
# CPU only
pnpm tauri build

# With GPU acceleration
pnpm tauri build --features cuda
```

Produces `src-tauri/target/release/bundle/` with `.msi` and `.exe`.

### Running via WSL2 + Windows

The project compiles inside WSL2 (Linux), but the Windows Tauri
binary must be built on Windows (WebView2, WASAPI). Workflow:

- **Dev:** `pnpm tauri dev` inside WSL for fast iteration (runs as
  a Linux GUI via WSLg)
- **Windows build:** via GitHub Actions (`release.yml`) or running
  `pnpm tauri build` directly from PowerShell

## Structure

- [docs/architecture/overview.md](./docs/architecture/overview.md) — modules, flows, IPC
- [docs/architecture/decisions/](./docs/architecture/decisions/) — ADRs (one per choice)
- [docs/architecture/conventions.md](./docs/architecture/conventions.md) — code style
- [docs/specs/](./docs/specs/) — spec-driven design, one feature per file
- [docs/roadmap.md](./docs/roadmap.md) — phases F1–F5
- [docs/status.md](./docs/status.md) — current skeleton state
- [docs/lessons.md](./docs/lessons.md) — lessons learned
- [CONTRIBUTING.md](./CONTRIBUTING.md) — branch, commit, and PR conventions
- [CLAUDE.md](./CLAUDE.md) — minimum context for Claude Code

## License

MIT — see [LICENSE](./LICENSE).
