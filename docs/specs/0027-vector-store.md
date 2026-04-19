# Spec 0027: Embedded vector store

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0026
- **Relevant ADRs:** —

## Why
Persist and query embeddings locally, without an external service.

## Scope

### In
- Option 1: `lancedb` (Arrow-native, Rust-native)
- Option 2: embedded Qdrant
- Option 3: rusqlite + sqlite-vss extension

### Out
- Cloud vector DB

## Open questions
- Benchmark with 10k notes: which option delivers <50ms queries
  with acceptable footprint
