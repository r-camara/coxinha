# Specs — Spec-Driven Design

One spec per feature. A spec captures **what** has to exist and
**how we'll know it's done** (acceptance). Technical **how** lives
in [`docs/architecture/`](../architecture/) (overview + ADRs).

Golden rule: **code is born from a spec, a spec is born from a
decision**. If a PR does not fit any spec, or a spec is missing,
either the spec needs writing or the PR is out of scope.

## Conventions

- 4-digit numbering: `0001-*.md`
- Never renumber or reuse. If a feature is dropped, flip the status
  to `rejected` and keep the file for history.
- Phase declared in the header (F1, F1.5, F2, F3, F4)
- Small specs over giant ones. Past ~200 lines, split into sub-specs.

## Status

- `draft` — no consensus yet, big changes still possible
- `in-progress` — implementation started
- `done` — merged to main, acceptance passed
- `rejected` — decided against; file kept for history

## Index

### F1 — Local-first MVP

| #    | Feature                                                  | Status      |
|------|----------------------------------------------------------|-------------|
| 0001 | [Markdown notes](./0001-notes.md)                        | in-progress |
| 0002 | [Daily notes](./0002-daily-notes.md)                     | draft       |
| 0003 | [Tray-resident + auto-launch](./0003-tray-resident.md)   | in-progress |
| 0004 | [Global shortcuts](./0004-global-shortcuts.md)           | in-progress |
| 0005 | [Call detection](./0005-call-detection.md)               | draft       |
| 0006 | [Mic + loopback recording](./0006-recording.md)          | draft       |
| 0007 | [Whisper/Parakeet transcription](./0007-transcription.md)| draft       |
| 0008 | [Diarization](./0008-diarization.md)                     | draft       |
| 0009 | [LLM summarization](./0009-summarization.md)             | draft       |
| 0010 | [FTS5 full-text search](./0010-search-fts.md)            | draft       |
| 0033 | [Internationalization (i18n + l10n)](./0033-i18n.md)     | in-progress |
| 0034 | [Accessibility baseline](./0034-a11y-baseline.md)        | in-progress |

### F1.5 — Rich blocks

| #    | Feature                                                  | Status |
|------|----------------------------------------------------------|--------|
| 0011 | [Mermaid block](./0011-mermaid-block.md)                 | draft  |
| 0012 | [Excalidraw block](./0012-excalidraw-block.md)           | draft  |
| 0013 | [Wiki-links `[[note]]`](./0013-wiki-links.md)            | draft  |
| 0014 | [Tags `#project`](./0014-tags-filter.md)                 | draft  |

### F2 — Optional sync

| #    | Feature                                                  | Status |
|------|----------------------------------------------------------|--------|
| 0015 | [Sync backend (Axum + Postgres)](./0015-sync-backend.md) | draft  |
| 0016 | [Sync client + WebSocket](./0016-sync-client.md)         | draft  |
| 0017 | [Conflict resolution (CRDT)](./0017-crdt-conflict.md)    | draft  |
| 0018 | [Read-mostly web UI](./0018-web-read-ui.md)              | draft  |
| 0019 | [Auth (Keycloak / JWT)](./0019-auth.md)                  | draft  |

### F3 — External integrations

| #    | Feature                                                  | Status |
|------|----------------------------------------------------------|--------|
| 0020 | [Microsoft Graph OAuth](./0020-oauth-microsoft.md)       | draft  |
| 0021 | [Google Calendar/Tasks OAuth](./0021-oauth-google.md)    | draft  |
| 0022 | [MS Todo / Google Tasks sync](./0022-tasks-sync.md)      | draft  |
| 0023 | [GitHub PRs/issues sync](./0023-github-sync.md)          | draft  |
| 0024 | [Azure DevOps sync](./0024-azdo-sync.md)                 | draft  |
| 0025 | [Unified daily timeline](./0025-unified-timeline.md)     | draft  |

### F4 — Advanced AI layer

| #    | Feature                                                  | Status |
|------|----------------------------------------------------------|--------|
| 0026 | [Automatic embeddings](./0026-embeddings.md)             | draft  |
| 0027 | [Embedded vector store](./0027-vector-store.md)          | draft  |
| 0028 | [Chat with the vault](./0028-chat-vault.md)              | draft  |
| 0029 | [MCP server](./0029-mcp-server.md)                       | draft  |
| 0030 | [Long-term memories](./0030-long-term-memory.md)         | draft  |
| 0031 | [Pre-meeting briefing](./0031-pre-meeting-briefing.md)   | draft  |
| 0032 | [Auto-tag + auto-link](./0032-auto-tag-link.md)          | draft  |

## Template

```md
# Spec NNNN: Short name

- **Status:** draft | in-progress | done | rejected
- **Phase:** F1 | F1.5 | F2 | F3 | F4
- **Owner:** name
- **Depends on:** links to other specs / ADRs
- **Relevant ADRs:** ADR-NNNN

## Why
User problem in 2-3 sentences. Link evidence when available.

## Scope

### In
- explicit list of what's included

### Out
- explicit list of what is NOT included (point to another spec if
  applicable)

## Behavior (acceptance)
Verifiable criteria. Use "Given / When / Then" or short imperatives.
Each bullet must be testable (manually or automated).

## Design notes
Affected modules, IPC commands, DB tables, vault paths. Keep short —
heavy detail belongs in `docs/architecture/`.

## Open questions
Pending decisions that block or shape the implementation.
```
