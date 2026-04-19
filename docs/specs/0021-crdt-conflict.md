# Spec 0021: Conflict resolution (CRDT)

- **Status:** draft
- **Phase:** F2
- **Owner:** Rodolfo
- **Depends on:** spec 0020
- **Relevant ADRs:** ADR-0003

## Why
Editing the same note offline on two PCs + syncing must not lose
work.

## Scope

### In
- Yjs-compatible CRDT (BlockNote supports it) for rich content
- Backend stores yjs updates + periodic markdown snapshots
- Automatic merge, no conflict UI in most cases

### Out
- CRDT for vault structure (paths, names) → simple rule:
  last-write-wins with history

## Behavior (acceptance)
- Same note edited offline on A and B: after sync, the result is a
  semantic merge (both changes present)
- Delete vs edit: edit wins (recovery preferred)

## Open questions
- On-disk markdown snapshot: generated from the CRDT or canonical
  (CRDT derived)? Prefer markdown canonical so the app still works
  without an online CRDT.
