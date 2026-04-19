# Spec 0012: Excalidraw block

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001
- **Relevant ADRs:** ADR-0011

## Why
Sketch an idea in seconds, no syntax to remember.

## Scope

### In
- Custom block rendering a thumbnail of the scene
- Click opens a fullscreen modal (VS Code extension-style)
- Scene stored as `.excalidraw.json` under `~/coxinha/attachments/`
- Markdown references it via
  `![alt](attachments/<id>.excalidraw.json)`

### Out
- Realtime collaboration → F2+

## Behavior (acceptance)
- **Create:** `/excalidraw` inserts an empty block, opens the modal
- **Close modal:** scene saved, thumbnail refreshed
- **Reopening a note with a block:** thumbnail renders without
  opening the modal

## Design notes
- `@excalidraw/excalidraw` npm package
- Or export to SVG/PNG and store the image + source JSON

## Open questions
- In-note format: external reference (portable) vs inline JSON
  (self-contained but noisy)
