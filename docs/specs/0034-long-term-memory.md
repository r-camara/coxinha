# Spec 0034: Long-term memories

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0032
- **Relevant ADRs:** —

## Why
Relevant facts extracted from notes and meetings live in a stable
store and become context for future prompts.

## Scope

### In
- Async LLM extraction: "what in this note should become a fact?"
- `memories` table (dedicated) with a source reference
- Optional injection into summary/chat prompts

### Out
- Automatic contradiction handling → future concern
