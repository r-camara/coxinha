# Spec 0013: Wiki-links `[[note]]`

- **Status:** in-progress
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0005
- **Relevant ADRs:** ADR-0015 (layered knowledge)
- **Layer:** Knowledge (links are an unambiguous derivation of
  what the user typed; no inference involved)

## Why
Link notes together without copying paths; Obsidian/Logseq-flavored
lightweight syntax.

## Scope

### In
- `[[Note title]]` syntax recognized in markdown
- Autocomplete when typing `[[` (top-N by relevance)
- Click navigates to the note; if it doesn't exist, create it
- Backlinks visible at the bottom of the open note

### Out
- Aliases (`[[target|label]]`) → future iteration
- Block-level links → F4+

## Behavior (acceptance)
- **Typing `[[reu`:** dropdown shows matching notes
- **Enter:** inserts the link, editor stays inline
- **Click on a link to a non-existent note:** creates the note with
  that title, navigates
- **Backlinks:** list of notes that reference the current one,
  updates when any note is edited

## Design notes
- Parser in the backend (or a simple regex in the frontend) to
  extract wiki-links from markdown and index them in a `note_links`
  table
- Backlinks UI: separate component below the editor

## Shipped (as of 2026-04-19)

- `[[target]]` and `[[target|alias]]` recognized in any note body,
  parsed on every save.
- `links` table (`source_id`, `target_text`, `target_lc`) with
  `ON DELETE CASCADE` from `notes`.
- `storage::backlinks(id)` resolves the target note's current
  title + filename stem as keys — renames don't orphan a link,
  the query always matches present state.
- IPC `get_backlinks(id)` exposed via specta.
- Right-pane "Linked from" panel in `NoteEditor` — 64 px wide,
  lists backlinks ordered by `updated_at DESC`, click opens.
- Tests: 6 for the extractor (plain, aliases, malformed, unicode,
  adjacent/nested, path stem), 3 round-trip through `storage`, 6
  DB roundtrip (replace, case-insensitive dedup, multi-key,
  empty-keys, delete cascade, ignore-empty), 6 for the React
  panel (loading, ready, empty, error, click navigation,
  refetch on id change).

## Still open

- **Autocomplete when typing `[[`**. Needs a popover in the
  BlockNote editor surface. Design-first task; defer until we
  have a clear UX that doesn't fight BlockNote's slash menu.
- **Click-to-create missing note**. Right now an unresolved
  `[[Foo]]` just shows no backlinks until Foo exists. "Follow
  the link" is UX-level: needs a BlockNote inline-link plugin.
- **Rename propagation**. We sidestep it by resolving at query
  time, so a rename leaves backlinks intact until the linker
  saves again. If the linker never saves, its stored
  `target_text` still matches by old title — and **also** by new
  title if the old text happened to equal the new one. Acceptable
  until someone writes the "stale link warning" feature.
- **Tags as a second relation type** (`#project`) — spec 0014.

## Open questions
- Resolve by exact title vs fuzzy (titles can collide) — we
  went with exact (case-insensitive); fuzzy is autocomplete's
  job, not the linker's.
- Renaming a note: skipped per above — let the index lag; the
  next save catches up.
