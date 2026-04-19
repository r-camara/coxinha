# Spec 0010: FTS5 full-text search

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0001 (notes)
- **Relevant ADRs:** ADR-0002

## Why
The vault will grow. "Where did I write about X?" needs to be
instant.

## Scope

### In
- `notes_fts` virtual table (SQLite FTS5)
- Tokenizer `unicode61 remove_diacritics 2` (friendly for
  accented content in any language)
- Command `search_notes(query) -> Vec<Note>`
- UI: sidebar search box with live results (150ms debounce)
- Rebuild index via `rebuild_from_vault` (when the DB is lost)

### Out
- Search inside meeting transcripts → F1.5+ (add a separate
  `meetings_fts`)
- Semantic search / embeddings → F4, spec 0026
- Tag/date filters → F1.5+

## Behavior (acceptance)
- **Simple query** "client meeting": returns relevant notes in
  <50ms for a vault up to 10k notes
- **Accented query** "cafe": matches "café" (diacritics stripped)
- **Prefix** "clie*": matches "client", "clients"
- **Quoted** `"exact phrase"`: only contiguous match
- **No results:** empty list, UI shows "Nothing found"
- **While indexing many notes** (import): UI stays responsive
- **DB deleted:** `rebuild_from_vault` scans the `.md` files on disk
  and repopulates; app returns to normal

## Design notes
- `src-tauri/src/db.rs`: `search_notes` already implemented
- `notes_fts` mirrored in `upsert_note` (delete + insert on FTS side)
- Query escaping: wrap in quotes to avoid accidental FTS5 operators
- Rebuild: scan `~/coxinha/notes/*.md`, read the title from the
  first heading, populate `notes` and `notes_fts`

## Open questions
- Ranking: default `bm25` vs tuned weights (title > body)
- Snippet highlighting in results: use FTS5's `snippet()` —
  trade-off of uglier sidebar design
- Search-as-you-type vs enter-to-search: start with the 150ms
  auto-debounce
