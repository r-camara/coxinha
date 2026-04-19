# Architecture

## Overview

Coxinha is a tray-resident Tauri desktop app. All heavy work (audio,
STT, diarization, LLM, DB) runs in Rust in the native process. The
React frontend is purely visual — it does not make decisions.

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (React + BlockNote + shadcn + Tailwind)        │
│  ├─ NoteEditor    ← BlockNote WYSIWYG, image paste        │
│  ├─ MeetingsList  ← history + player                      │
│  ├─ Agenda        ← daily notes + tasks                   │
│  └─ Tray UI       ← call-detected toast                   │
│                                                           │
├──── Typed IPC (tauri-specta) ───────────────────────────┤
│                                                           │
│  Rust backend (src-tauri/)                                │
│  ├─ lib.rs           → setup, tray, shortcuts             │
│  ├─ db.rs            → rusqlite + FTS5                    │
│  ├─ storage.rs       → filesystem vault                   │
│  ├─ recorder.rs      → cpal + wasapi (mic + loopback)     │
│  ├─ call_detector.rs → windows crate (COM)                │
│  ├─ transcriber/     → trait + impls (Whisper/Parakeet)   │
│  ├─ diarizer/        → trait + impls (pyannote/speakrs)   │
│  └─ summarizer.rs    → genai (Claude/Ollama/OpenAI)       │
│                                                           │
├── OS (Windows / macOS / Linux) ─────────────────────────┤
│  ├─ Tray icon + global shortcuts                          │
│  ├─ WASAPI (loopback audio + mic)                         │
│  ├─ COM (audio session polling for call detection)        │
│  └─ Filesystem (~/coxinha/)                               │
└──────────────────────────────────────────────────────────┘
```

## Companion documents

- [`vault-schema.md`](./vault-schema.md) — authoritative schemas
  for every file Coxinha writes into `~/coxinha/`, including the
  note ↔ meeting link rule and the versioning policy.
- [`meeting-pipeline.md`](./meeting-pipeline.md) — meeting state
  machine, engine defaults, retry policy, crash recovery, and
  fallback matrix.
- [`conventions.md`](./conventions.md) — Rust + frontend coding
  conventions, i18n and a11y rules.
- [`decisions/`](./decisions/) — ADRs (one per decision).

## Filesystem layout

**The user's vault is canonical. The DB is just a rebuildable index.**

```
~/coxinha/
├── notes/
│   ├── 2026-04-18-product-idea.md
│   └── 2026-04-19-client-meeting.md
├── meetings/
│   └── 2026-04-18-standup/
│       ├── metadata.json       # participants, times
│       ├── recording.wav       # 16kHz mono
│       ├── transcript.json     # segments + speakers
│       └── summary.md          # LLM output
├── attachments/
│   └── 2026-04-18-143025.webp  # pasted images (auto-WebP)
├── daily/
│   └── 2026-04-18.md           # daily note
└── .coxinha/
    ├── index.db                # SQLite + FTS5
    ├── config.toml             # preferences
    └── models/                 # cached ONNX + GGUF
        ├── parakeet-tdt-0.6b-v3-int8/
        ├── segmentation-3.0.onnx
        └── wespeaker-voxceleb-resnet34-LM.onnx
```

Any file in the vault is editable by any Markdown editor (Obsidian,
VS Code, Notepad). Coxinha does not invent a proprietary format.

## Rust modules

### `lib.rs`
Entry point. Configures:
- Tray icon + menu (Open, Record, Settings, Quit)
- Global shortcuts (`Ctrl+Alt+N/C/A/M/R`)
- Hidden window at boot
- Auto-launch plugin
- Background tasks: `call_detector`, `db_watcher`

### `db.rs`
`rusqlite` with FTS5. Tables:
- `notes` (id, path, title, tags, updated_at)
- `meetings` (id, title, started_at, duration, participants_json)
- `notes_fts` (FTS5 virtual table)

Rebuildable from the vault.

### `storage.rs`
Vault abstraction:
- `save_note(id, content)` → writes `.md`
- `load_note(id)` → reads `.md`
- `save_attachment(bytes, hint)` → WebP under `attachments/`
- `watch()` → signals external changes (Obsidian, VS Code)

### `recorder.rs`
`cpal` + `wasapi`. Mixes mic + loopback into a 16kHz mono WAV (ideal
for Parakeet/Whisper). Writes in chunks for crash resilience.

### `call_detector.rs`
3s polling of `IAudioSessionManager2` (via the `windows` crate).
Detects known processes (Teams, Zoom, Meet in a browser). Emits a
`call-detected` event.

### `transcriber/`
**Pluggable trait.** Implementations:

| Impl | Crate | Model | Notes |
|------|-------|-------|-------|
| `WhisperTranscriber` | `whisper-rs` | whisper.cpp GGUF | Default for dev. Fast CPU, optional CUDA |
| `ParakeetTranscriber` | `transcribe-rs` | Parakeet TDT v3 ONNX INT8 | 25 languages incl. PT, faster than Whisper |

Choice driven by `config.toml`:
```toml
[transcriber]
engine = "parakeet"  # or "whisper"
model_path = "~/coxinha/.coxinha/models/parakeet-tdt-0.6b-v3-int8"
accelerator = "cuda"  # or "cpu", "directml"
```

### `diarizer/`
**Pluggable trait.** Implementations:

| Impl | Crate | Pipeline | Notes |
|------|-------|----------|-------|
| `PyannoteDiarizer` | `pyannote-rs` | segmentation-3.0 + wespeaker | Simple, CPU OK |
| `SpeakrsDiarizer` | `speakrs` | Full pyannote community-1 | 2-7x faster on CUDA |
| `NoneDiarizer` | — | passes segments without speakers | Dev default |

### `summarizer.rs`
`genai` crate. Provider selected by config:
```toml
[summarizer]
provider = "claude"  # ollama, claude, openai, groq, openrouter
model = "claude-sonnet-4-5"
```

Prompt templates live in `src-tauri/resources/prompts/`.

## IPC

The frontend calls the backend via `invoke()`. Types are generated
with `tauri-specta`:

```ts
import { commands } from '@/lib/tauri';

const note = await commands.createNote({
  title: 'New idea',
  content: '# Header\n\nbody',
});
```

Main commands:
- `create_note`, `update_note`, `delete_note`, `list_notes`, `search_notes`
- `start_recording`, `stop_recording`, `list_recordings`
- `transcribe_meeting`, `diarize_meeting`, `summarize_meeting`
- `get_active_calls`, `subscribe_call_events`
- `get_config`, `update_config`

## Startup flow

```
T=0ms    → Tauri spawns the process
T=20ms   → lib.rs runs, creates tray icon
T=40ms   → Hidden window created (WebView not rendering yet)
T=50ms   → Global shortcuts registered
T=60ms   → Call detector task spawned
T=70ms   → DB opened (lazy)
T=80ms   → Ready. ~80MB RAM

User presses Ctrl+Alt+N:
T=0ms    → Shortcut fires
T=10ms   → Window.show() + focus
T=30ms   → BlockNote editor focused, cursor ready
         ↑ user is already typing
```

**STT/diarization models load lazily** (only on first use). First
transcription takes ~5s cold; subsequent calls <1s.

## Future sync (F2)

Architecture-ready. A future `sync.rs` module will:
- Push local changes to the backend over WebSocket
- Pull incrementally on startup
- Resolve conflicts via CRDT (Yjs-compatible with BlockNote)

The filesystem stays canonical. The backend becomes an authoritative
replica when available.
