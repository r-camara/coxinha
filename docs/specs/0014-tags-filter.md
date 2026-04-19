# Spec 0014: Tags `#project` with filter

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001, spec 0010
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
