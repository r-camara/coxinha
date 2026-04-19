# Spec 0028: Chat with the vault

- **Status:** draft
- **Phase:** F4
- **Owner:** Rodolfo
- **Depends on:** spec 0026, spec 0027
- **Relevant ADRs:** ADR-0005

## Why
"What did I discuss with X about Y in March?" — RAG over personal
memory.

## Scope

### In
- Chat UI (new view)
- Retrieval via the vector store + simple re-rank
- Prompt with citations for the LLM (provider via spec 0005)
- Clickable citations open the source note

### Out
- Autonomous agents → F5
