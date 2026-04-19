# Spec 0016: Sync client + WebSocket

- **Status:** draft
- **Phase:** F2
- **Owner:** Rodolfo
- **Depends on:** spec 0015
- **Relevant ADRs:** ADR-0002

## Why
Keep local replicas on multiple PCs consistent with the backend.

## Scope

### In
- `sync.rs` module in src-tauri
- Incremental pull on boot (since last sync timestamp)
- Push of local changes (fs watcher → backend)
- WebSocket for server→client pushes in realtime
- Exponential backoff retries; offline-tolerant

### Out
- Conflict resolution → spec 0017

## Behavior (acceptance)
- **Offline:** app works normally, changes enqueued
- **Reconnect:** queue drains; subsequent edits flow as usual
- **First login:** full vault download

## Design notes
- Persistent queue in SQLite (`sync_queue` table)
- Reconciliation: content hash + updated_at
