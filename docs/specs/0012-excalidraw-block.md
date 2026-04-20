# Spec 0012: Excalidraw block

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0005
- **Relevant ADRs:** ADR-0011, ADR-0017

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

## Follow-up (per ADR-0017)

Standalone canvases become a first-class resource alongside notes,
not only an attachment embedded in markdown.

- Storage: `workspaces/<ws>/canvases/<uuid>.excalidraw.json`
- UUID + light metadata (title, type, workspace) either embedded
  in the Excalidraw scene (if the upstream schema's extension
  fields support it cleanly) or carried in a companion
  `.meta.yml` sidecar — decided at implementation time.
- A note embeds a standalone canvas via `[[canvas:<uuid>]]` or a
  transclusion block; thumbnail render stays as described above.
- Inline canvas (attachment under `<ws>/attachments/`) remains
  unchanged — used for sketches pinned to one note.

The original scope of this spec is preserved; the standalone case
is additive. Full acceptance criteria for standalone canvases
live in spec 0041.
