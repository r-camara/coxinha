# ADR-0003: BlockNote as the editor

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
We need a Notion-like editor with image paste, with minimum effort.
Alternatives: plain Tiptap, Lexical, CodeMirror, custom.

## Decision
BlockNote with `@blocknote/shadcn`.

## Consequences
- **+** ~5-line setup
- **+** Slash menu, drag handles, image paste, dark mode for free
- **+** Automatic Markdown in/out (Obsidian-compatible)
- **+** Meetily uses it (validation)
- **−** Less flexible than plain Tiptap for very specific custom blocks
  (mitigation: Tiptap extensions still work via `_tiptapOptions`)
