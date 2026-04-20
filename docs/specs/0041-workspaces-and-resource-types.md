# Spec 0041: Workspaces and resource type taxonomy

- **Status:** draft
- **Phase:** F2 (lands with or shortly after sync client; structure
  migration can ship earlier as F1 housekeeping)
- **Owner:** Rodolfo
- **Depends on:** ADR-0017 (required), spec 0019 + 0020 (workspace-
  aware sync, when F2 wires in), spec 0004 (DB migrations)
- **Relevant ADRs:** ADR-0002, ADR-0015, ADR-0016, ADR-0017
- **Layer:** Knowledge (structure over existing Knowledge; nothing
  new in Memory)

## Why

ADR-0017 decides the storage model. This spec implements it end to
end: migrates the current flat vault into `workspaces/default/`,
wires `workspace_id` and `type` from filesystem through the DB
index, IPC surface, and UI route tree, and adds the workspace
switcher.

Ships in two halves that can land in separate PRs: **(a)** the
filesystem + DB + IPC half, which is pure housekeeping and
F1-safe; **(b)** the UI switcher and URL route changes, which
depend on spec 0039 having shipped.

## Scope

### In

**(a) Storage and index**

- Filesystem migration, one-time, idempotent:
  - If `~/coxinha/workspaces/` is absent, create
    `workspaces/default/` and move existing `notes/`, `daily/`,
    `meetings/`, `attachments/` under it.
  - Generate `workspaces/default/.workspace.toml` with `id`
    (UUID v7), `slug = "default"`, `name = "Default"`,
    `created_at` set to the earliest mtime across the moved tree
    (falling back to now).
  - Logged as a line in `.coxinha/migrations/history.jsonl` so
    an audit can see the reshape.
- `.workspace.toml` schema (goes into `vault-schema.md`):
  ```toml
  version = 1
  id = "018f3b5a-0000-7000-8000-000000000000"
  slug = "default"
  name = "Default"
  description = ""
  icon = "home"
  created_at = "2026-04-20T12:00:00Z"
  ```
- `.coxinha/types/<slug>.yml` schema (optional file):
  ```yaml
  version: 1
  name: "Spike"
  icon: "zap"
  template: "..."
  ```
- DB migration (spec 0004 style):
  - `workspaces` table — rebuildable from `.workspace.toml` scan
  - `resource_types` table — rebuildable from
    `.coxinha/types/*.yml` scan (empty on first boot is fine)
  - New `canvases` table: `(id, workspace_id, type, path,
    created_at, updated_at, title)`
  - Add `workspace_id NOT NULL` to `notes`, `meetings`
    (backfilled during migration)
  - Add `type TEXT NULL` to `notes`, `canvases`, `meetings`
- Frontmatter additions (all optional, defaults are "the first /
  only workspace" and "the kind's default type"):
  - Notes: `workspace: <slug>` and `type: <slug>`
  - Canvases: `{ workspace, type, title }` embedded in the
    Excalidraw scene metadata **or** in a companion `.meta.yml`
    — chosen at implementation time based on what the upstream
    schema supports cleanly
  - Meetings: `workspace` and `type` inside `metadata.json`
- `rebuild_from_vault` upgrade: walks `workspaces/*/`, reads
  sidecar + frontmatter, regenerates every row including the new
  FK columns.

**(b) IPC and UI**

- Commands (tauri-specta):
  - `list_workspaces() -> Vec<Workspace>`
  - `create_workspace(slug, name, description?) -> Workspace`
  - `rename_workspace(id, name) -> Workspace`
  - `set_active_workspace(id)` — persisted to `config.toml`,
    restored on boot
  - Existing `list_notes`, `search_notes`, `create_note`, and
    friends gain an optional `workspace: Option<String>`
    argument; default = active workspace
- URL tree (ADR-0016 extension): `/w/:workspace/notes/$noteId`,
  `/w/:workspace/agenda`, etc. Root `__root` route hydrates the
  active workspace from `config.toml`; URL param overrides.
- Sidebar workspace switcher at the top; shows active workspace
  with a dropdown of siblings, "+ New workspace" at the bottom.
- Type is a small chip near the title in the editor; unknown
  types render with their raw slug, no console error.

### Out

- Workspace-level auth / membership / roles — spec 0023 and a
  later workspace-permissions spec.
- Share inheritance from workspace membership — covered by the
  spec 0040 update (separate doc, already drafted).
- Custom type *editor* UI (creating templates without editing a
  file). F3+; for F2 users hand-edit `.coxinha/types/<slug>.yml`.
- Cross-workspace search / unified timeline. Proposal: revisit
  alongside spec 0029.
- Per-workspace type overrides (`<ws>/.coxinha/types/`). Global
  types only in F2; per-workspace override added when someone
  asks for it.
- Multi-vault. Explicitly not on the roadmap (rejected in
  ADR-0017).
- Obsidian-import workspace mapping — spec 0037 picks up the new
  layout after this spec lands; its scope is not changed here.

## Behavior (acceptance)

Every item below is test-covered.

1. **Migration is idempotent.** `rebuild_from_vault` run twice on
   a migrated vault produces byte-identical DB state. Rerunning
   the migrator on an already-migrated vault is a no-op and
   writes nothing to `history.jsonl`.
2. **Default workspace after upgrade.** First boot after upgrade
   on a pre-ADR-0017 vault has exactly one workspace named
   `default`. Its `id` is stable across restarts.
3. **Create and switch.** Create workspace `arquitetura`; run
   `set_active_workspace("arquitetura")`; run `create_note`. The
   resulting file is under
   `workspaces/arquitetura/notes/<id>.md`. URL updates to
   `/w/arquitetura/notes/<id>`.
4. **Workspace isolation in search.** `search_notes` from
   `arquitetura` returns zero hits from `default` for a query
   that matches in `default`. Global/cross-workspace search is
   out of scope.
5. **Unknown type does not break render.** A note with
   `type: spike-v3` (no matching `.coxinha/types/spike-v3.yml`)
   renders with "spike-v3" as the chip, no console error, no
   blank page.
6. **Frontmatter round-trip.** Save then reload a note with
   `workspace: arquitetura, type: adr`; both fields survive
   byte-identical through one save/load cycle.
7. **Rebuild from vault.** Delete `.coxinha/index.db`; restart.
   `rebuild_from_vault` reproduces `workspaces`, `resource_types`,
   and all FK columns from filesystem alone.
8. **Perf budgets unchanged.** Boot budget (2 s, spec 0003) and
   new-note budget (2 s, spec 0003) hold with two workspaces of
   500 notes each.
9. **Slug immutability.** Attempting to change `slug` through
   `rename_workspace` is rejected. Changing `name` works.
10. **Kind default when type is missing.** A markdown file under
    `<ws>/notes/` with no `type:` frontmatter is indexed with
    `type = NULL` and renders as `note`. A `.excalidraw.json`
    under `<ws>/canvases/` with no type renders as `canvas`.

## Design notes

- **Active workspace persisted in `config.toml`** (`[app]
  active_workspace = "default"`). Boot restores it, URL overrides
  per-session.
- **Slug is path-safe and immutable.** Lowercase ASCII + hyphens,
  2–40 chars. Rename changes `name` but not `slug` — keeps links
  (wiki-link and share token paths) stable.
- **Workspace delete is out of scope for F2.** A hidden
  workspace lives on disk until manually removed. Add a UX for
  delete when the first user actually asks.
- **Canvas storage.** Standalone canvases live at
  `workspaces/<ws>/canvases/<uuid>.excalidraw.json`. UUID and
  title travel inside the scene metadata if the upstream
  Excalidraw schema supports extension fields cleanly; otherwise
  a companion `.meta.yml` sidecar carries them. Inline
  (attachment-embedded) canvases stay under `<ws>/attachments/`
  and follow spec 0012 original behavior.
- **Meetings retain their bundle shape.** `metadata.json`,
  `recording.wav`, `transcript.json`, `summary.md` unchanged in
  internal layout — only the parent path gains the workspace
  prefix. Spec 0007/0008 artifacts are untouched.
- **`history.jsonl` for structural events.** Workspace create /
  rename / (future) delete, cross-workspace move. One line per
  event, `{ ts, actor, op, before, after }`. Content-level
  history stays in Yjs (spec 0021). Grep-friendly.
- **Route tree from ADR-0016 extends with one segment.** The
  `/w/:workspace` parent route loads workspace context; children
  keep their existing shapes. Empty `/` redirects to
  `/w/<active>/notes`.
- **All new commands go through tauri-specta.** `Workspace` and
  `ResourceType` types land in `bindings.ts`. No untyped string
  maps for workspace identity.
- **Global `.coxinha/types/` shared across workspaces in F2.**
  Scope is global to keep the surface minimal; spec 0041.5 or
  later adds per-workspace override if demanded.

## Open questions

- Sidebar shows one workspace at a time (switcher) vs multiple
  flattened? Proposed: single + switcher, Notion/AnyType style.
  Open to change after usability feedback.
- Global hotkey (`Ctrl+Alt+N`) targets active workspace silently
  or prompts? Proposed: silent to active. The hotkey is for
  quick capture, not decision-making.
- Daily notes per workspace, or one global `daily/` above all?
  Proposed: per workspace. Re-open if feedback asks for unified
  daily.
- `.coxinha/types/` — per-user global vs per-workspace? Proposed:
  global for F2, override added later.
- `canvases` vs `diagrams` as the folder name? Proposed:
  `canvases` (matches the vocabulary of the Excalidraw / tldraw
  world). Open to reconsidering during implementation.

## Test plan summary

- Unit: slug validator, path resolver (`note_id → workspace`),
  frontmatter round-trip, type fallback to kind default.
- Integration: migration idempotency on a pre-ADR-0017 fixture,
  `rebuild_from_vault` on a mixed-workspace fixture, create /
  switch end-to-end through the IPC layer.
- UI smoke (Vitest): switcher renders options, navigate fires,
  route resolves to active workspace on cold boot.
- Perf: boot + new-note budgets with a 2-workspace × 500-note
  fixture. Existing `perf_new_note.rs` and `boot_smoke.rs` are
  the regression gates.
