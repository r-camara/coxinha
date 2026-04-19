# Roadmap

## F1 — Local-first MVP (in progress)

**Goal:** replace Fathom for personal use on Windows.

### Core
- [x] Tauri + React + BlockNote + shadcn setup
- [ ] Tray-resident + auto-launch + global shortcuts
- [ ] Note editor with image paste (auto WebP compression)
- [ ] Automatic daily notes
- [ ] Filesystem-backed storage (`~/coxinha/notes/*.md`)
- [ ] SQLite FTS5 for search

### Audio and meetings
- [ ] Call detector (Teams/Zoom/Meet)
- [ ] Mic + WASAPI loopback recording
- [ ] `Transcriber` trait with `WhisperTranscriber` default
- [ ] Optional `ParakeetTranscriber` behind a feature flag
- [ ] `Diarizer` trait with `NoneDiarizer` default
- [ ] Optional `PyannoteDiarizer`

### LLM
- [ ] Summarization via `genai` (Claude + Ollama)
- [ ] Configurable prompt templates
- [ ] Meeting-to-markdown integration

### Global shortcuts
- [ ] `Ctrl+Alt+N` — quick new note
- [ ] `Ctrl+Alt+C` — open last view
- [ ] `Ctrl+Alt+A` — today's agenda
- [ ] `Ctrl+Alt+M` — meetings list
- [ ] `Ctrl+Alt+R` — toggle manual recording

## F1.5 — Rich blocks (post-MVP)

- [ ] Mermaid block (~60 lines of a custom BlockNote block)
- [ ] Excalidraw block (fullscreen modal, VS Code-extension style)
- [ ] `[[note]]` wiki-links with autocomplete
- [ ] `#project` tag filter
- [ ] Diarization upgrade: `SpeakrsDiarizer`

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
