# Spec 0005: Notes, daily notes, and search

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0002 (testing baseline)
- **Relevant ADRs:** ADR-0002 (local-first), ADR-0003 (BlockNote)

## Why
The note side of the product. The user needs to jot ideas quickly,
drop into a per-day scratchpad, and find things later. Notes must
be plain `.md` on disk so Obsidian/VS Code/Notepad keep working on
the same vault.

## Scope

### In
- Note CRUD via IPC: `create_note`, `update_note` (returns the
  updated `Note`), `delete_note`, `list_notes`, `get_note`
- Each note = one `.md` in `~/coxinha/notes/<slug>-<short-id>.md`
  following the frontmatter rules in `architecture/vault-schema.md`
- BlockNote editor with image paste (WebP compression both
  client- and server-side via `save_attachment`)
- Debounced autosave (500ms); the store patches the single entry
  locally instead of re-fetching `list_notes`
- Title extracted from the first heading; tags extracted from
  inline `#tag` occurrences and merged with any frontmatter tags
- **Daily notes** — one file per day at
  `~/coxinha/daily/YYYY-MM-DD.md`. Lazy creation: the file appears
  when the user first opens "Agenda" or saves content for the day.
  Configurable template (default: `# YYYY-MM-DD\n\n## Notes\n\n`)
- **Full-text search** — SQLite FTS5 virtual table `notes_fts`
  indexed by `notes_tokenize='unicode61 remove_diacritics 2'`
  (diacritic-insensitive, friendly to any language). Command
  `search_notes(query) -> Vec<Note>`, live results in the
  sidebar with 150ms debounce
- `rebuild_from_vault` reconstructs both `notes` and `notes_fts`
  by scanning the vault when the DB is deleted
- Atomic writes (tmp + rename) so crashes can't truncate a note

### Out
- Wiki-links `[[...]]` → spec 0013 (F1.5)
- Tags filter UI → spec 0014 (F1.5)
- Transcript search (inside meetings) → F1.5+
- Semantic / embedding-based search → spec 0030 (F4)

## Behavior (acceptance)

### Notes
- **Create:** "+ New" in the sidebar creates
  `~/coxinha/notes/new-note-<hash>.md` and adds it to the list
- **Edit:** typing in the editor updates the `.md` 500ms later
  with the new markdown and a fresh `updated_at`; the store
  patches the one row without re-fetching
- **Rename via heading:** changing the `# H1` updates the note
  `title` without moving the file
- **Delete:** removes the `.md` and the DB row; idempotent; no
  TOCTOU
- **Image paste:** PNG/JPG pasted into a block becomes
  `~/coxinha/attachments/<stamp>.webp`, referenced in the markdown
- **Crash safety:** `SIGKILL` mid-autosave leaves a valid `.md`
- **External edit:** Obsidian saving the same `.md` is picked up
  on next list refresh (real watcher comes in spec 0018)

### Daily notes
- Opening "Agenda" with no file for today creates today's file
  using the default template
- Opening yesterday's daily is read-write; no prompt
- Daily files are listed alongside notes (same DB table, `kind`
  flag) and are searchable by FTS5

### Search
- `"client meeting"` returns matching notes in <50ms for a vault
  up to 10k notes
- `"cafe"` matches `"café"` (diacritics stripped)
- `clie*` matches `client`, `clients`
- `"exact phrase"` only contiguous match
- No results → empty list, UI shows "Nothing found"
- Live UI stays responsive while indexing large imports

## Design notes
- Backend: `src-tauri/src/storage.rs` (CRUD + attachments),
  `src-tauri/src/db.rs` (`notes`, `notes_fts`)
- New: `get_or_create_daily(date)` command; `kind` flag in the
  `notes` table
- Frontend: `src/components/NoteEditor.tsx`, sidebar lives in
  `src/components/Sidebar.tsx`, store in `src/lib/store.ts`
- File layout follows `architecture/vault-schema.md` to the letter

## Open questions
- Day cutover: local midnight vs 4am Logseq-style? (Start with
  local midnight; revisit if annoying.)
- Snippet highlighting in search results via FTS5 `snippet()`:
  yes but behind a flag, default off until it doesn't clutter the
  sidebar layout.
- Search-as-you-type vs enter-to-search: default 150ms debounce.
