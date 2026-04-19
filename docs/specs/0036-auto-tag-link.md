# Spec 0036: Auto-tag + auto-link for new notes

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0030, spec 0032
- **Relevant ADRs:** —

## Why
Less friction to categorize; the vault grows organized without
extra effort.

## Scope

### In
- On create/edit: LLM suggests 1-3 tags and 1-3 wiki-links
- UI shows suggestions at the bottom; accept with a click
- Learns user preferences (avoids resuggesting what was rejected)

### Out
- Automatic retagging of old notes → F5
