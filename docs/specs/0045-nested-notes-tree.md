# Spec 0045: Nested notes tree in the sidebar

- **Status:** draft
- **Phase:** F1 (housekeeping, lands with or after spec 0041)
- **Owner:** Rodolfo
- **Depends on:** spec 0005 (notes), spec 0041 (workspaces),
  spec 0037 (Obsidian vault adoption — the import path that
  brings nested folders in)
- **Relevant ADRs:** ADR-0002 (filesystem canonical)
- **Layer:** Outputs (sidebar rendering over Knowledge)

## Why

The sidebar today renders a flat `Recent` list + a tag list.
Adopting an Obsidian vault (spec 0037) brings in folder
hierarchy — and right now we flatten it. Any vault with >50
notes in subfolders (typical Obsidian layout: `Projects/`,
`Daily/`, `Archive/`) becomes unnavigable.

Filesystem is canonical (ADR-0002). The sidebar should mirror
it.

## Scope

### In

- **Tree panel** inside the sidebar, replaces today's flat
  `RECENT` section. Mounts under the workspace's root:
  - Folders render as collapsible rows. Child count in mono
    grey at the right edge.
  - Notes render as leaves. Title + subtle path breadcrumb
    only shown when the note's `title != filename stem`.
  - Sort: folders first (alpha ascending), then notes (most
    recently updated descending within a folder).
- **Expand / collapse** per folder. Persisted in
  `.coxinha/ui-state.json` per workspace (so a refresh
  doesn't close everything). Default: root folder expanded,
  subfolders collapsed.
- **Drag-to-move** a note between folders. Moves the
  underlying `.md` file + updates the DB row. Atomic. If the
  move fails (permission, collision), the visual position
  reverts and a toast reports.
- **Right-click context menu:** Rename · Move to… ·
  Reveal in File Explorer · Delete (→ spec 0044 trash).
- **Root-level "Recent" pseudo-folder** sits above the tree,
  collapsed by default. Shows the 5 most recently opened
  notes regardless of folder — preserves the fast "where was
  I" path.
- **Search scoping by folder** — right-click a folder →
  "Search in this folder" opens the command palette (spec
  0043) with a scope pill already selected.
- **Keyboard nav:** arrow up / down moves through tree.
  `→` expands, `←` collapses. `Enter` opens note in current
  tab. `Ctrl+Enter` opens in new tab.
- **i18n:** all labels keyed.

### Out

- **Graph view** — explicit non-goal. Obsidian-centric, not
  our philosophy.
- **Multi-select drag** — single-note drag only in F1.
- **Tree in the web UI** (spec 0022) — web is read-mostly;
  if a tree surfaces there it's via a follow-up.
- **File operations other than move** (copy, symlink) — out of
  scope; the filesystem is canonical, users can do that in
  Explorer.

## Behavior (acceptance)

1. **Tree reflects filesystem.** A subfolder
   `notes/projects/coxinha.md` added externally appears in
   the tree after the next `rebuild_from_vault` or file
   watcher tick.
2. **Expand / collapse persists.** Toggle a folder closed,
   reload app, it stays closed. Vitest with mocked store.
3. **Drag moves.** Drag `notes/projects/coxinha.md` into
   `notes/archive/` — the file ends up at
   `notes/archive/coxinha.md` on disk; the DB row's `path`
   updates; the sidebar shows it in the new location.
4. **Atomic move.** An integration test: intercept the
   filesystem call to fail; assert the DB row did not
   change and the UI reverted.
5. **Context menu** has the five items and Rename is
   inline-edit (focuses an input within the tree row,
   commits on Enter).
6. **Keyboard arrow nav** covers all rows, including
   collapsed state.
7. **A11y.** Tree renders with `role="tree"` and
   `role="treeitem"`; `aria-expanded` on folders;
   `aria-level` reflects depth.
8. **Perf.** 10 k-note vault with 500 folders renders the
   root in under 120 ms (spec 0003 budget). Virtualization
   kicks in for folders with >200 children.

## Design notes

- **Component:** `src/features/shell/NotesTree.tsx`. Reads
  from a new store `useTreeStore` that exposes the tree
  shape (computed from the `notes` store's path array). The
  computation is memoized — recomputes only on
  folder-structure changes, not on content edits.
- **Virtualization:** use `@tanstack/react-virtual` (already
  in the ecosystem we adopted with `@tanstack/react-query`).
  Only virtualize when a folder has >200 children — keeps
  scroll-indicator behaviour familiar for small vaults.
- **Drag and drop:** native HTML5 DnD API. No library.
- **Indent:** 16 px per level. Folder chevron (Lucide
  `chevron-right`) rotated 90° when open. Tiny `folder`
  icon (Lucide) for each folder, optional `file-text` for
  notes — or omit on notes to reduce visual noise (watch
  orange-budget).
- **Context menu:** shadcn `ContextMenu` primitive from spec
  0042 primitives.
- **Rename-in-place:** existing input border-inherits the
  row; Save on Enter / blur. Validation: non-empty, slug-
  safe for the filename stem (retitles markdown heading via
  `storage.rs` update flow).
- **"Recent" pseudo-folder** renders as a stacked item with
  Lucide `clock` icon, italicized label. Clicking the chevron
  expands it; items within don't show their folder path.

## Open questions

- **Persist the sort order** (alpha vs recent) per folder, or
  global? Proposed: global setting first; per-folder if
  users ask.
- **Show tag pills inside the tree?** Tags are cross-folder,
  so a pill inside one folder row is awkward. Proposed: keep
  TAGS as a separate section below the tree (current
  behaviour).
- **File watcher load under 10k-note vaults** — `notify`
  might fire too many events on bulk operations. Consider
  debouncing the tree rebuild at 250 ms.

## Test plan summary

- **Vitest**: tree render, expand/collapse persistence,
  keyboard nav, context menu actions (wired to mocks).
- **Unit**: tree derivation from flat notes array,
  pseudo-folder computation.
- **Integration** (new `tree_move.rs` under `src-tauri/tests/`):
  drag-to-move atomicity under filesystem failure.
- **Perf**: 10 k-note + 500-folder fixture, initial render
  budget.
