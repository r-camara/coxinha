# Spec 0022: MS Todo / Google Tasks sync

- **Status:** draft
- **Phase:** F3
- **Owner:** Rodolfo
- **Depends on:** spec 0020, spec 0021
- **Relevant ADRs:** —

## Why
Unified agenda: every TODO for the day in one place.

## Scope

### In
- Periodic pull (5 min) of open tasks
- Unified representation in the agenda (spec 0025)
- Marking complete syncs back (two-way)

### Out
- Creating a Coxinha-only task: its own spec

## Open questions
- Dedupe between MS Todo and Google Tasks when the user mirrors?
- Conflict: task completed on A, edited on B
