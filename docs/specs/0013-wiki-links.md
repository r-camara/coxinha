# Spec 0013: Wiki-links `[[note]]`

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001
- **Relevant ADRs:** —

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

## Open questions
- Resolve by exact title vs fuzzy (titles can collide)
- Renaming a note: update all references? Expensive in a large
  vault.
