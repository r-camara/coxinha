# Spec 0002: Daily notes

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0001 (notes)
- **Relevant ADRs:** —

## Why
A per-day capture pad (Obsidian/Logseq style). Removes the "where
do I put this loose note?" friction.

## Scope

### In
- One file per day at `~/coxinha/daily/YYYY-MM-DD.md`
- Lazy creation: only created when the user opens or writes
- `Ctrl+Alt+A` (agenda) jumps straight to today's daily
- Configurable template (default: `# YYYY-MM-DD\n\n## Notes\n\n`)

### Out
- Rollups (weekly/monthly aggregation)
- External calendar integration (Google/Outlook) → F3, spec 0025

## Behavior (acceptance)
- Opening "Agenda" with no daily file creates today's file using
  the default template
- Opening "Agenda" the next day does not touch yesterday's file;
  it creates a new one
- Edits flow through the same autosave as spec 0001
- Note listing separates "notes" from "daily" (but both searchable)
- Opening an old daily: read-only? editable? → open question

## Design notes
- Backend: new command `get_or_create_daily(date)` in `storage.rs`
- Frontend: `src/App.tsx` agenda route becomes a container for the
  daily file's editor
- Does the `notes` table hold dailies too, or a separate table?
  → decision: same table, with a `kind` flag

## Open questions
- Timezone: OS local or UTC? (prefer local, matches the user's calendar)
- Day cutover: local midnight or 4am Logseq-style?
- Old daily editable without prompt, or with a confirmation?
