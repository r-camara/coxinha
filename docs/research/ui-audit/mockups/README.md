# UI Mockups

Design artifacts for Coxinha. Two formats coexist:

- **SVG** — the first-pass mockups, hand-authored. Render
  natively in VSCode preview. Comment-annotated. Cheap to diff.
- **`.pen` (Pencil.dev)** — higher-fidelity mockups built via
  the Pencil MCP server against the design tokens in
  `../DESIGN.md`. Source-of-truth for anything that needs real
  typography, spacing, and palette rendering.

When the two disagree, `.pen` wins — it is what the actual app
is trending toward.

## Files

| File | Format | What it shows |
|---|---|---|
| `coxinha-notes-writing.png` | PNG export from `coxinha.pen` | `/notes/$id` during active writing — sidebar populated, editor with title + body + H2 + bullets + cursor, BacklinksPanel on the right |
| `coxinha.pen` | Pencil source | Live document. Source for `coxinha-notes-writing.png`. See "Source files" below — you may need to save it from Pencil Desktop (Ctrl+S) the first time. |
| `app-shell-current.svg` | SVG | First-pass sketch: current centered-CTA empty state (pre-spec-0042) |
| `app-shell-desired.svg` | SVG | First-pass sketch: target full-bleed editor + max-width column |
| `empty-state-current.svg` | SVG | First-pass sketch close-up: today's centered-CTA |
| `empty-state-desired.svg` | SVG | First-pass sketch close-up: target type-to-start |
| `empty-state-flow.svg` | SVG | First-pass sketch: draft lifecycle (focus → type → persist, or focus → blur → discard) |
| `route-map.md` | Mermaid | Route tree + shortcut-to-navigate sequence |

## How to view

- **PNG:** VSCode renders natively. Click the file.
- **SVG:** VSCode "Open Preview" on the file. Hand-edit directly
  to comment or sketch.
- **`.pen`:** Open in [Pencil Desktop](https://pencil.dev).
  VSCode does not render `.pen` files.
- **`.md` (route-map):** VSCode Markdown preview (Ctrl+Shift+V)
  renders embedded Mermaid diagrams.

## Source files

The `.pen` files are Pencil's native format, produced via the
Pencil MCP server (`mcp__pencil__*` tools in this session). The
source of truth for aesthetic rules is `../DESIGN.md` — Pencil
reads that document when generating new screens.

**Important:** Pencil Desktop does not auto-save to the target
path until you press Ctrl+S inside the app. After a mockup
session, confirm with `ls mockups/*.pen` and save in Pencil if
the file is missing.

## How to regenerate the PNG from the `.pen`

Inside Pencil Desktop: File → Export → PNG (or Command Palette
→ "Export node as PNG"). Pick `2x` scale to match the version
committed here.

Via MCP (from a Claude Code session with Pencil MCP connected):

```
mcp__pencil__export_nodes({
  filePath: "<absolute path>/coxinha.pen",
  nodeIds: ["<node id of the root window frame>"],
  outputDir: "<absolute path>/mockups",
  format: "png",
  scale: 2,
})
```

## Design doctrine

All mockups (SVG and `.pen`) trace back to `../DESIGN.md` — the
single source of truth for palette, typography, component
behaviour, motion, and the banned-pattern list. When in doubt,
the doctrine wins.

Related research:

- `../screenshots/` — Playwright captures of the live app
- `../ui-audit.md` — prose analysis of current state vs direction
- `../shortcut-map.md` — evidence trail for the Win+Y decision
- `../type-model-benchmark.md` — product-taxonomy comparison
  (AnyType / Obsidian / Notion / Mem / Granola)
