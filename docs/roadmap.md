# Roadmap

## F1 — Local-first MVP (in progress)

**Goal:** replace Fathom for personal use on Windows.

### ⭐ Critical path — close the meeting loop

Without this chain Coxinha is a slower Obsidian. These items are
F1's reason to exist and block everything else:

- [ ] Mic + WASAPI loopback recording → 16kHz mono WAV (spec 0006)
- [ ] Windows COM call detection for Teams/Zoom/Meet (spec 0005)
- [ ] `Transcriber` trait with `WhisperTranscriber` default (spec 0007)
- [ ] `Diarizer` trait with real `PyannoteDiarizer` wiring (spec 0008)
- [ ] `transcribe_meeting` orchestration: recorder → transcriber →
      diarizer → `transcript.json` on disk → `has_transcript` flipped
      in the DB (spec 0007 design notes)
- [ ] Summarization via `genai` persists `summary.md` next to the
      recording (spec 0009)

### Editor and vault

- [x] Tauri + React + BlockNote + shadcn setup
- [ ] Tray-resident + auto-launch (spec 0003)
- [ ] Global shortcuts (spec 0004)
- [ ] Note editor with image paste, WebP compression (spec 0001)
- [ ] Filesystem-backed storage, `~/coxinha/notes/*.md` (spec 0001)
- [ ] SQLite FTS5 search (spec 0010)
- [ ] Automatic daily notes (spec 0002)
- [ ] Meetings list view (spec 0035)
- [ ] Settings view UI (spec 0036)

### Optional STT engine

- [ ] `ParakeetTranscriber` behind a feature flag (spec 0007)

### LLM integration polish

- [ ] Configurable prompt templates
- [ ] Meeting ↔ note cross-linking (open a note and see the related
      meeting; open a meeting and see notes mentioning it)

### Cross-cutting

- [ ] i18n infrastructure in place (spec 0033)
- [ ] Accessibility baseline (spec 0034)
- [ ] Testing & reliability baseline — smoke tests for `db.rs` /
      `storage.rs`, rebuild-index test, crash-recovery test,
      Windows CI (spec 0038)
- [ ] Database migrations formalized (spec 0041)
- [ ] Dependency hardening — pin RC/unstable crates before F1 ship
      (`tauri-specta`, `specta-typescript`, `ort`, `transcribe-rs`,
      `pyannote-rs`)

## F1.5 — Rich blocks and real-product polish

- [ ] Mermaid block (~60 lines of a custom BlockNote block)
- [ ] Excalidraw block (fullscreen modal, VS Code-extension style)
- [ ] `[[note]]` wiki-links with autocomplete (spec 0013)
- [ ] `#project` tag filter (spec 0014)
- [ ] Diarization upgrade: `SpeakrsDiarizer`
- [ ] Vault import from existing Obsidian/Logseq folders (spec 0037)
- [ ] Vault backup & export (spec 0039)
- [ ] Installer & first-run onboarding (spec 0040)
- [ ] External edit conflict resolution (spec 0042)

## F2 — Multi-PC via optional sync

- [ ] Rust backend (Axum + Postgres)
- [ ] Desktop sync client (push/pull over WebSocket)
- [ ] Conflict resolution (Yjs-compatible with BlockNote)
- [ ] Read-mostly web UI (check vault from another PC)
- [ ] Auth: self-hosted Keycloak or plain JWT

## F3 — External integrations

- [ ] Microsoft OAuth (Graph API) — loopback + PKCE
- [ ] Google OAuth (Calendar + Tasks)
- [ ] MS Todo / Google Tasks sync → unified agenda
- [ ] GitHub PRs/issues/assigned sync
- [ ] Azure DevOps work items sync
- [ ] "Everything I need to do today" timeline

## F4 — Advanced AI layer

- [ ] Automatic embeddings (local `fastembed`)
- [ ] Embedded Qdrant or lancedb
- [ ] Chat with the vault ("what did I discuss with X in March?")
- [ ] MCP server exposed to Claude Desktop, Cursor, etc.
- [ ] Long-term memories (extracted facts)
- [ ] Pre-meeting briefing
- [ ] Auto-tagging + auto-linking of new notes

## F5 — Beyond

- [ ] Post-meeting coaching (pattern analysis)
- [ ] Slide screen capture with OCR
- [ ] Bot-less video recording (desktop capture)
- [ ] Visual knowledge graph (React Flow)
- [ ] Mobile companion PWA
- [ ] Cross-platform: macOS via CoreML, Linux via Vulkan
