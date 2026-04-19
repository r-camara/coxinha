# ADR-0011: Mermaid and Excalidraw deferred to F1.5

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
We want diagram blocks in the editor, but custom BlockNote blocks
are non-trivial and the libraries are heavy (Mermaid ~500KB,
Excalidraw ~1MB+).

## Decision
Not part of F1. Move to F1.5 once the MVP is shipping.

## Consequences
- **+** F1 ships sooner
- **+** Smaller initial surface for bugs
- **−** No diagrams in the first month
