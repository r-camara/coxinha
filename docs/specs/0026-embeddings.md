# Spec 0026: Automatic embeddings

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0001
- **Relevant ADRs:** ADR-0010

## Why
Foundation for semantic search, chat with the vault, and memory.

## Scope

### In
- `fastembed` (or equivalent Rust crate) running locally
- Embeddings generated in the background when a note changes
- Stored in the vector store (spec 0027)
- Small default model (MiniLM-L6 or bge-small)

### Out
- Fine-tuning → no

## Open questions
- Chunking strategy: whole note vs paragraph?
- Full reindex vs incremental
