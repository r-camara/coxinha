# Spec 0042: External edit conflict resolution

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001 (notes)
- **Relevant ADRs:** ADR-0002

## Why
The vault is plain Markdown on disk, explicitly so Obsidian,
VS Code, Syncthing, etc. can touch the same files. Today any
external change made while Coxinha is open is silently shadowed
until the note is reopened. That's a data-loss surprise waiting
to happen.

## Scope

### In
- `notify` file watcher on `~/coxinha/notes/`, `~/coxinha/daily/`,
  and `~/coxinha/attachments/`
- Debounce rapid events (editor saves often) — 300ms default
- When a **not-currently-open** note changes: update the DB
  (re-parse title + tags) and push a `NoteChanged` event; the
  sidebar updates silently
- When a **currently-open** note changes on disk:
  - If the editor buffer is clean: auto-reload with a subtle
    toast ("Reloaded from disk")
  - If the editor buffer is dirty: modal with three choices —
    "Keep mine", "Use the version on disk", "Open in external
    diff tool"
- File deletion: prompt "This note was deleted externally. Close
  the tab?" — yes closes, no re-creates it from the editor buffer
- Rename/move: treat as delete + create; the in-memory tab keeps
  editing the original path until the user acts on the prompt

### Out
- Realtime collaborative editing (that's F2 sync with CRDT)
- Three-way merge UI with diff highlighting → F2
- Conflict resolution at the block level (BlockNote) → F2

## Behavior (acceptance)
- **External edit while idle:** edit a note in Obsidian → the
  Coxinha sidebar title/updated_at refresh within 2s
- **External edit while editing clean:** edit in Obsidian → the
  open editor re-renders with the new content, toast confirms
- **External edit while editing dirty:** edit in Obsidian → modal
  fires; "Keep mine" wins writes local buffer; "Use disk" loads
  disk content; "Open external diff" spawns `code --diff ...` (or
  configured tool)
- Renames and deletions don't crash the app or leave orphan DB
  rows
- Watcher handles network shares and OneDrive paths correctly
  (or fails gracefully with a log line)

## Design notes
- Backend: `Storage::watch()` returns a `Stream<VaultEvent>`; the
  Tauri side consumes and emits typed events
- Event dedupe: track `(path, mtime, content_hash)` to suppress
  events the app just caused by its own writes
- Frontend: each open note tracks a `dirty` flag; the store
  reacts to `NoteChanged` events according to the flag

## Open questions
- Debounce window: 300ms right for Obsidian's write pattern?
  Test and tune.
- External diff tool default: VS Code? Configurable in Settings
  (spec 0036).
