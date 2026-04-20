# UI Mockups

Design artifacts for Coxinha. Two formats coexist:

- **SVG** — the first-pass mockups, hand-authored. Render
  natively in VSCode preview. Comment-annotated. Cheap to diff.
- **`.pen` (Pencil.dev)** — higher-fidelity mockups built via
  the Pencil MCP server against the design tokens in
  `../DESIGN.md`. Source-of-truth for anything that needs real
  typography, spacing, and palette rendering.

When the two disagree, `.pen` wins — it is what the app is
trending toward.

## System mockup (`coxinha.pen`)

Six frames cover the whole Coxinha shell. All frames share the
same sidebar, tab bar chrome, and design tokens from
`../DESIGN.md` (neutral Zinc baseline + Coxinha Orange as
signal). PNGs exported at 2× scale.

| File | Route | Viewport | Notes |
|---|---|---|---|
| `coxinha-notes-writing.png` | `/notes/$noteId` | 1440×900 | Active writing state — tab bar with 3 open notes, sidebar populated, editor with title + body + H2 + bullets + cursor, BacklinksPanel on the right |
| `coxinha-quick-capture.png` | Win+Y hotkey | 900×600 | Floating compact window triggered by the global hotkey. No sidebar, no backlinks panel. Single tab "Untitled" + "+". Just tab bar + editor. Notepad/Obsidian-inspired clean capture surface |
| `coxinha-notes-dark.png` | `/notes/$noteId` (dark) | 1440×900 | Dark mode variant of the main frame. Theme flip handled by the `mode` theme axis — same tokens, different surface values. Coxinha Orange unchanged |
| `coxinha-agenda.png` | `/agenda` | 1440×900 | Daily note open in a tab ("Hoje — 20 abr"). Agenda nav item active. Tasks heading with `[ ] unchecked` bullets. BacklinksPanel visible (a daily note is a note — it can have backlinks) |
| `coxinha-meetings.png` | `/meetings` | 1440×900 | List view of past meetings grouped by TODAY / YESTERDAY, each row showing title · duration (mono) · status. No BacklinksPanel (list view, not a single-document view) |
| `coxinha-settings.png` | `/settings` | 1440×900 | Appearance section with theme chips (Auto active in orange, Light/Dark outlined) + Global Shortcuts list showing `New note → Win+Y` and `Show / Hide → Win+Shift+C`. Settings item in sidebar footer highlighted |

Every frame lives inside the same `coxinha.pen` document; open
the file in Pencil Desktop to edit any of them. The node IDs at
the time of export are embedded in the PNG filenames via the
Pencil MCP export convention (`export_nodes` writes
`<nodeId>.png`), then renamed in a post-step.

## Orange discipline (sanity-check)

Per `DESIGN.md` rule, no screen should carry more than three
orange appearances. Count per frame:

- **Notes writing (3):** `+ New` button, active-note tint in
  sidebar list, save dot in meta row, active `#projeto` tag
  pill (4 — borderline; watch next iteration)
- **Quick capture (2):** `+ New` button at tab bar (implicit),
  save dot in tab
- **Dark notes (3):** same as light with slightly softer orange
  on dark surfaces
- **Agenda (3):** `+ New` button, active-note tint, save dot,
  active tag pill (same count/slots as Notes writing)
- **Meetings (2):** `+ New` button, active tag pill in sidebar
- **Settings (2):** `+ New` button, active theme chip "Auto"

## First-pass SVG mockups (retained)

| File | What it shows |
|---|---|
| `app-shell-current.svg` | Pre-spec-0042 centered-CTA empty state |
| `app-shell-desired.svg` | Target full-bleed editor + max-width column |
| `empty-state-current.svg` | Close-up of pre-spec-0042 centered-CTA |
| `empty-state-desired.svg` | Close-up of the type-to-start state |
| `empty-state-flow.svg` | Lifecycle: focus → type → persist, or focus → blur → discard |
| `route-map.md` | Mermaid route-tree + shortcut-to-navigate sequence |

## How to view

- **PNG:** VSCode renders natively. Click the file.
- **SVG:** VSCode "Open Preview" on the file. Hand-edit
  directly to comment or sketch.
- **`.pen`:** Open in [Pencil Desktop](https://pencil.dev).
  VSCode does not render `.pen` files. The source is there for
  editing; the PNG exports are the review artifact.
- **Markdown with Mermaid:** VSCode Markdown preview
  (Ctrl+Shift+V) renders the embedded diagrams.

## Source file

`coxinha.pen` stays in the repo once you Ctrl+S inside Pencil
Desktop — the MCP tools update the live document but do not
auto-save to disk. After a mockup session, confirm with
`ls mockups/*.pen` and save in Pencil if the file is missing.

## Regenerating the PNGs

Inside Pencil Desktop: File → Export → PNG at 2× scale, for
each top-level frame.

Via MCP (from a Claude Code session with Pencil MCP
connected):

```
mcp__pencil__export_nodes({
  filePath: "<absolute path>/coxinha.pen",
  nodeIds: ["<node id of frame>"],
  outputDir: "<absolute path>/mockups",
  format: "png",
  scale: 2,
})
```

The node IDs are visible in the `.pen` file and via
`get_editor_state`.

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
