# Roadmap

## F1 — Local-first MVP (in progress)

**Goal:** replace Fathom for personal use on Windows.

F1 specs are implemented in numeric order. Spec `NNNN` is the
`NNNN`-th thing we ship — no sub-phases, no abstractions of order.
On-disk contracts in
[`architecture/vault-schema.md`](./architecture/vault-schema.md);
meeting state machine, fallbacks, and retry policy in
[`architecture/meeting-pipeline.md`](./architecture/meeting-pipeline.md).

- [ ] **0001 — Build & dependency baseline**
      **Done when:** `cargo check --workspace` + `pnpm typecheck`
      green on Ubuntu and Windows CI with the toolchain at 1.88+
      and RC crates pinned (`tauri-specta`, `specta-typescript`,
      `ort`, `transcribe-rs`, `pyannote-rs`).
- [ ] **0002 — Testing & reliability baseline**
      **Done when:** `cargo test --workspace` green; five UI
      smoke paths pass on every PR; `pnpm test` covers store
      patch behavior and i18n key coverage.
- [ ] **0003 — Cold-start + load benchmarks**
      **Done when:** `cargo bench` reports cold/warm start,
      list-notes, FTS5 search, and idle memory numbers against
      the ADR-0007 budgets; CI flags >20% regressions on every
      PR from this point on.
- [ ] **0004 — Database migrations**
      **Done when:** the existing schema is migration V1; a V2
      migration applies idempotently; rolled-back app refuses
      to start with a clear message.
- [ ] **0005 — Notes, daily notes, and search**
      **Done when:** `.md` CRUD + autosave + FTS5 search round-trip
      against a real vault; `rebuild_from_vault` reconstructs the
      index identically; daily note auto-creates on first Agenda
      open of the day.
- [ ] **0006 — App shell: tray + auto-launch + global shortcuts**
      **Done when:** app boots hidden into the tray; the five
      shortcuts open the window in <100ms; closing the X hides
      and doesn't quit; auto-launch persists across logoff.
- [ ] **0007 — Recording & call detection**
      **Done when:** Teams/Zoom/Meet calls surface the typed
      `CallDetected` event within 3s; mic + loopback recording
      produces a playable 16kHz mono WAV whose header survives
      a mid-recording `SIGKILL`.
- [ ] **0008 — Meeting pipeline: transcribe + diarize + summarize**
      **Done when:** a `recorded` meeting walks the full state
      machine to `ready` with the default engines (Whisper base
      CPU → `NoneDiarizer` → Ollama `llama3.2:3b`); `transcript.json`
      validates against `vault-schema.md`; a missing API key
      fails with the env var name, not a panic; a crash mid-flight
      reconciles on next launch.
- [ ] **0009 — Meetings list view**
      **Done when:** finished meetings appear in the list within
      1s of `stop_recording`; clicking opens the detail with
      audio player, transcript, summary; soft-delete moves the
      folder to `.trash/`.
- [ ] **0010 — Settings view UI**
      **Done when:** every `AppConfig` field is editable from
      the UI; save round-trips through `update_config`; shortcut
      rebinding captures real key events; Test-connection works
      for Ollama and at least one cloud LLM provider.

## F1.5 — Rich blocks and real-product polish

- [ ] 0011 Mermaid block
- [ ] 0012 Excalidraw block (fullscreen modal)
- [ ] 0013 `[[note]]` wiki-links with autocomplete
- [ ] 0014 `#project` tag filter
- [ ] 0015 Vault import from existing Obsidian/Logseq folders
- [ ] 0016 Vault backup & export (zip + scheduled + restore)
- [ ] 0017 Installer & first-run onboarding (CPU/CUDA variants)
- [ ] 0018 External edit conflict resolution (watcher + modal)
- [ ] Diarization upgrade: `SpeakrsDiarizer`
- [ ] `ParakeetTranscriber` behind the `stt-parakeet` feature
- [ ] Meeting ↔ note cross-linking
- [ ] Configurable prompt templates

## F2 — Multi-PC via optional sync

- [ ] 0019 Rust sync backend (Axum + Postgres)
- [ ] 0020 Desktop sync client + WebSocket
- [ ] 0021 Conflict resolution (Yjs-compatible CRDT)
- [ ] 0022 Read-mostly web UI
- [ ] 0023 Auth (Keycloak or plain JWT)

## F3 — External integrations

- [ ] 0024 Microsoft OAuth (Graph API)
- [ ] 0025 Google OAuth (Calendar + Tasks)
- [ ] 0026 MS Todo / Google Tasks sync
- [ ] 0027 GitHub PRs/issues/assigned sync
- [ ] 0028 Azure DevOps work items sync
- [ ] 0029 Unified daily timeline

## F4 — Advanced AI layer

- [ ] 0030 Automatic embeddings (local `fastembed`)
- [ ] 0031 Embedded vector store (lancedb or Qdrant)
- [ ] 0032 Chat with the vault (RAG)
- [ ] 0033 MCP server exposed to Claude Desktop, Cursor, etc.
- [ ] 0034 Long-term memories (extracted facts)
- [ ] 0035 Pre-meeting briefing
- [ ] 0036 Auto-tagging + auto-linking of new notes

## F5 — Beyond

- [ ] Post-meeting coaching (pattern analysis)
- [ ] Slide screen capture with OCR
- [ ] Bot-less video recording (desktop capture)
- [ ] Visual knowledge graph (React Flow)
- [ ] Mobile companion PWA
- [ ] Cross-platform: macOS via CoreML, Linux via Vulkan
