# UI Mockups

Paired SVG mockups (current state / desired state) for the main
Coxinha views, plus a Mermaid route diagram. SVG because VSCode
renders it natively — open the file, right-click → *Open Preview*
(or install the *SVG Preview* extension for live edits).

Pencil Project (`.epgz`) was considered — going with SVG because
it is hand-editable text, renders in VSCode without an extension,
and keeps diffs reviewable in a PR. Excalidraw would have worked
too (the app already uses it via spec 0012) but requires the
Excalidraw extension for VSCode to render. We can migrate later
if you prefer the format.

## Files

| File | What it shows |
|---|---|
| `app-shell-current.svg` | Sidebar + centered "New note" CTA in main pane; fixed 280 px sidebar, no content max-width |
| `app-shell-desired.svg` | Same sidebar; main pane is a full-bleed editor on a transient draft; content column has a reading max-width on wide viewports |
| `empty-state-current.svg` | Close-up of today's empty state — orange CTA button floating in empty main pane |
| `empty-state-desired.svg` | Close-up of the type-to-start state — editor with a low-opacity placeholder ("Type to start.") and no CTA |
| `empty-state-flow.svg` | Timeline of the draft lifecycle: focus → type → persist; or focus → blur (empty) → discard |
| `route-map.md` | Mermaid diagram of the route tree wired by `src/router.tsx` |

Current screenshots captured by `pnpm screenshots` live next door
in `../screenshots/` — flip between them and the mockups to see
before/after.

## How to discuss

Each SVG has comments inline calling out the layout intent (sidebar
width, content max-width, spacing). Drop a review comment on the
line that needs changing, or sketch over the SVG in VSCode — the
file is text, edits diff cleanly.
