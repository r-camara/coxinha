# Spec 0011: Mermaid block

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001
- **Relevant ADRs:** ADR-0011

## Why
Diagrams as code inside a note, without leaving for an external tool.

## Scope

### In
- BlockNote custom block rendering Mermaid
- Source/preview toggle inside the block
- Saved as a `mermaid` code fence in the markdown (Obsidian/GitHub compatible)

### Out
- Visual diagram editor → spec 0012 (Excalidraw)

## Behavior (acceptance)
- **Typing `/mermaid`:** inserts a block with a text editor + preview
- **Syntax error:** preview shows the error inline, does not break
  the editor
- **Markdown export:** renders as ` ```mermaid\n...\n``` ` compatible
  with other tools

## Design notes
- ~60 lines for the custom block (reuse the BlockNote example)
- `mermaid` loaded via dynamic import (code-split) to keep the
  bundle small

## Open questions
- Sync render vs a Worker (Mermaid can be slow for big diagrams)
