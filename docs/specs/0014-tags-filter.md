# Spec 0014: Tags `#project` with filter

- **Status:** shipped (2026-04-19, PR #8 — autocomplete deferred)
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0005
- **Relevant ADRs:** —

## Why
We already extract tags automatically in `storage.rs`; they just
need to be surfaced in the UI.

## Scope

### In
- Sidebar "Tags" section listing top tags with counts
- Clicking a tag filters notes by it
- Tag autocomplete when typing `#`

### Out
- Tag hierarchy (`#proj/sub`) → future iteration
- Global tag renaming → F2+

## Behavior (acceptance)
- **Vault with 3 `#idea` notes:** sidebar shows `#idea (3)`
- **Click `#idea`:** list reduces to those 3
- **Typing `#` in a note:** dropdown of existing tags

## Design notes
- Extraction already exists (`extract_tags`) + `tags_json` column
- `SELECT ... WHERE tags_json LIKE '%"tag"%'` is fine for small
  volumes; optimize later if slow

## Open questions
- Normalization: `#Idea` == `#idea`? (Yes — lowercase)
- Restrict to `[a-z0-9_-]` or allow unicode?

## Shipped
- `db::list_tags` aggregates via `json_each(tags_json)` with
  `GROUP BY` sorted by count DESC then tag ASC.
- `db::list_notes_by_tag` returns distinct notes ordered by
  `updated_at` DESC.
- `shared::TagCount { tag, count }` exposed over specta.
- Sidebar "Tags" section renders wrap of pill buttons (`#tag count`)
  with `aria-pressed` for the active filter; clicking an active
  pill toggles it off. Typing in search drops any active filter —
  last interaction wins (matches Obsidian).
- Acceptance covered by 4 Rust tests (`list_tags_aggregates…`,
  `list_tags_empty_vault_returns_empty`, `list_notes_by_tag_returns…`,
  `list_notes_by_tag_is_case_sensitive`) and 3 React tests
  (`renders tag pills with counts`, `filters the list when a pill
  is clicked`, `clears the tag filter`).
- **Deferred:** tag autocomplete on `#` inside the editor (separate
  follow-up spec — requires BlockNote inline suggestion plumbing).
