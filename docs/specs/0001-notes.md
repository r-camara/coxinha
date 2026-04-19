# Spec 0001: Markdown notes

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0002 (local-first), ADR-0003 (BlockNote)

## Why
The user needs to jot ideas quickly and re-read them later. Notes
must be plain files (Obsidian/VS Code friendly) so the user is
never locked into the app.

## Scope

### In
- Note CRUD via IPC: `create_note`, `update_note`, `delete_note`,
  `list_notes`, `get_note`
- Each note = one `.md` under `~/coxinha/notes/<slug>-<short-id>.md`
- BlockNote editor with image paste (auto-WebP via `save_attachment`
  with both backend and frontend compression)
- Debounced autosave (500ms) on edit
- Automatic title (first heading) and tag (`#xxx`) extraction
- SQLite index mirroring disk (for listing + search)

### Out
- Full-text search → spec 0010
- Wiki-links → spec 0013
- Daily notes → spec 0002
- Multi-PC sync → spec 0015

## Behavior (acceptance)
- **Create:** clicking "+ New" in the sidebar or the tray creates
  `~/coxinha/notes/new-note-<hash>.md` on disk and in the list
- **Edit:** typing in the editor updates the `.md` 500ms later with
  the new markdown and a fresh `updated_at` in the list
- **Rename via heading:** editing the `# H1` updates `title` without
  moving the file (path stays the same)
- **Delete:** `delete_note` removes the `.md` and the entry;
  idempotent (double delete does not break anything)
- **Image paste:** pasting a PNG/JPG into a block stores
  `~/coxinha/attachments/<stamp>-<name>.webp` referenced in the markdown
- **External edit:** saving the `.md` from Obsidian while the app is
  open is reflected on next list/open (depends on the future watcher
  spec; for now a manual reload is fine)
- **Crash safety:** killing the app mid-autosave does not corrupt
  the `.md` (write atomically: tmp + rename)

## Design notes
- Backend: `src-tauri/src/storage.rs` (exists),
  `src-tauri/src/db.rs` (`notes` + `notes_fts` tables)
- Frontend: `src/components/NoteEditor.tsx`, `src/lib/store.ts`
- Commands: `create_note`, `update_note`, `delete_note`, `list_notes`,
  `get_note`, `save_attachment`

## Open questions
- Atomic `.md` writes: `tempfile` + `rename`? Measure cost on Windows
  (slower than Linux)
- External watcher (`notify`): its own spec or part of this one?
  Recommendation: separate, because conflicts need their own story.
