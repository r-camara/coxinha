# Coxinha

> Crispy outside, tasty inside. Your local-first second brain with AI.

**Bot-less** desktop notetaker with meeting recording, transcription,
and personal memory. Runs 100% locally, works offline, tray-resident
with instant startup.

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
- Rust stable (1.82+)
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
