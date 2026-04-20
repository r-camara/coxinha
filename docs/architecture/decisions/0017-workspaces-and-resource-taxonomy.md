# ADR-0017: Workspaces and resource taxonomy

- **Date:** 2026-04-20
- **Status:** Proposed

## Context

Two gaps are about to collide and will get much harder to fix
once F2 ships.

1. **Scope.** Today every note, meeting, and attachment lives in
   a single flat vault. The user wants to keep a personal area
   **and** open a shared area "Arquitetura" holding architectural
   canvases, meeting transcripts/summaries, and per-team sharing.
   The vault has no primitive for this today — the closest thing
   is a folder, but folders carry no identity, settings, or
   membership.

2. **Type.** The vault has three implicit resource shapes:
   `notes/*.md`, `meetings/<id>/{recording,transcript,summary}`,
   and `attachments/*`. Excalidraw scenes live only as
   attachments embedded in markdown (spec 0012). The user wants
   first-class canvases and an explicit story for future shapes
   (ADRs as a document type, user stories, spikes, architecture
   diagrams). Without naming the type system, each new shape
   risks a one-off folder convention and ad-hoc DB columns.

Scope and type are tangled: workspaces are the natural permission
and share boundary for spec 0040 / 0023; resource types are the
natural unit of workspace content. Deciding them separately would
produce two inconsistent taxonomies.

A third question, raised during conversation and left implicit by
previous ADRs: **what is the SQLite index responsible for in this
new world?** ADR-0015 invariant 1 says the index is rebuildable
from the filesystem. Any new concept here must preserve that;
workspace-level settings and type definitions cannot sneak into
DB-only rows.

## Decision

Three linked choices.

### Decision 1 — Workspace is a top-level folder with a sidecar

Introduce `workspaces/` under `~/coxinha/`. Each workspace is a
folder whose children reuse today's vault layout, scoped:

```
~/coxinha/
├── workspaces/
│   ├── default/
│   │   ├── .workspace.toml
│   │   ├── notes/
│   │   ├── canvases/
│   │   ├── meetings/
│   │   ├── attachments/
│   │   └── daily/
│   └── arquitetura/
│       ├── .workspace.toml
│       └── ... (same shape)
└── .coxinha/
    ├── index.db
    ├── config.toml
    └── types/                 # optional, user-defined type templates
```

Workspace identity (UUID v7 `id`, `slug`, `name`, description,
icon, created_at), workspace-local preferences (default editor,
per-workspace LLM choice) and, in the future, member list, all
live in `.workspace.toml`. Versioned per the
`vault-schema.md` rule.

Considered and rejected:

- **Multi-vault** (one `~/coxinha-<name>/` per workspace): strong
  isolation but duplicates config, forces a process-per-vault or
  a vault-switcher UI, and makes cross-workspace links
  structurally impossible.
- **Pure frontmatter tag** (`workspace: arquitetura` with no
  folder): no export story ("hand me everything in Arquitetura"
  should be a `zip`), no OS-level permission surface, no path
  for future selective sync or E2E per workspace.
- **Nested inside notes/** (e.g., `notes/arquitetura/*.md`): works
  for markdown but not for `canvases/`, `meetings/`,
  `attachments/` — every top-level kind would have to repeat the
  nesting.

Default workspace is named `default`. On first run after upgrade,
spec 0041 migrates today's flat vault into `workspaces/default/`
idempotently.

### Decision 2 — Kind is closed, Type is open

Separate two concepts conflated in today's codebase.

- **Kind** is the storage shape. Closed, three values:
  - `markdown` — a single `.md` file with optional YAML
    frontmatter (notes, daily, meeting summary)
  - `binary` — a single opaque file (`.webp`, `.excalidraw.json`,
    future `.tldr`)
  - `bundle` — a folder with a declared manifest and sibling
    artifacts (meetings are today's only bundle)

  Kind drives serialization, diffing, sync chunking, and export.
  **Adding a kind requires an ADR.**

- **Type** is the user-visible category. Open, per-resource,
  declared via frontmatter:

  ```yaml
  type: spike           # or: note, adr, user-story, canvas, meeting, c4-diagram
  ```

  Type drives UI only: icon, default template, display label, the
  chip shown near the title. Unknown types render as `note` with
  the raw `type` string surfaced as a tag — never an error.

Type definitions are optional and live in `.coxinha/types/<slug>.yml`:

```yaml
version: 1
name: "Spike"
icon: "zap"
template: |
  # {{title}}
  ## Hypothesis
  ## Result
```

A missing type definition is harmless — the type still works, just
without template and custom icon. This is the "dynamic without
headache" property: adding a type is a file, not a migration, not
a code change.

This is **not** AnyType's model. AnyType makes Type a relational
object with schemas, fields, and views. We deliberately keep types
as labels; Coxinha is document-centric, not graph-centric, and a
relational type layer is overkill for the current product shape.

### Decision 3 — The DB indexes both; nothing moves into DB as canonical

The SQLite index gains two tables and three FK columns. All
derived, all rebuildable from filesystem scan:

- `workspaces(id, slug, name, path, created_at, updated_at)` —
  rebuilt by scanning `workspaces/*/.workspace.toml`
- `resource_types(slug, name, icon, template_hash)` — rebuilt by
  scanning `.coxinha/types/*.yml`
- `notes.workspace_id`, `canvases.workspace_id`,
  `meetings.workspace_id` — populated from folder path during
  `upsert_*` / `rebuild_from_vault`
- `notes.type`, `canvases.type`, `meetings.type` — populated from
  frontmatter; `NULL` means "default type for this kind"

ADR-0015 invariant 1 survives unchanged. `rebuild_from_vault`
walks `workspaces/*/`, reads sidecar + frontmatter, regenerates
every row. No workspace or type state is DB-only. Workspace-
specific AI memory (suggested tags, embeddings) continues to live
in the Memory layer under `.coxinha/memory/` per ADR-0015.

## Consequences

- **+** The "Arquitetura" use case maps cleanly:
  `workspaces/arquitetura/canvases/<uuid>.excalidraw.json`,
  shared at workspace level (spec 0040 update), meetings under
  `workspaces/arquitetura/meetings/<id>/`.
- **+** Adding a kind is rare and explicit; adding a type is a
  file — the extensibility path the conversation asked for.
- **+** Export, selective sync, per-workspace encryption (future)
  all hang off a single filesystem fact.
- **+** Spec 0040 gains a permission scope larger than "per-link":
  workspace membership (spec 0023 extension) grants implicit
  access; per-link share becomes an override.
- **+** URL tree under ADR-0016 extends naturally to
  `/w/:workspace/...` — one segment, no structural rework.
- **−** Migration: every existing file path moves under
  `workspaces/default/`. Covered by spec 0041 with an idempotent
  mover + DB rebuild.
- **−** Every new feature answers "workspace-scoped or global?" at
  spec time. Config lookups become workspace-first, global-back.
- **−** Introduces UX surfaces that need design: workspace
  switcher, cross-workspace linking, default-workspace-at-boot.
  These are spec 0041's problem; the ADR commits only to storage.
- **−** Sync protocol (spec 0019/0020) gains a workspace
  namespace. Preferable to retrofit now (draft) than after first
  release.

## Follow-up

- **Spec 0041** (companion to this ADR) — workspace and resource
  type implementation: filesystem migration, DB changes, IPC
  commands, UI switcher, frontmatter fields.
- **Spec 0012 update** — canvas as a first-class resource under
  `<ws>/canvases/`; inline-in-note canvas preserved.
- **Spec 0040 update** — workspace membership is the default
  share scope; per-link share is an override.
- **Spec 0019 / 0020 update (draft-level)** — workspace as a
  namespace dimension in the sync protocol; endpoints and
  client queues gain `workspace` as a parameter. Not an
  implementation change — a spec-level note so the F2 design
  starts correct.
- **Spec 0023 (when picked up)** — auth scope = workspace
  membership + role; `workspace_id` is a claim in the token.
- **`vault-schema.md`** — add workspace layout,
  `.workspace.toml` schema, and the `type:` frontmatter field.
- **`docs/architecture/overview.md`** — replace the flat-vault
  tree with the workspace layout.
- **`CLAUDE.md`** invariants — keep "Filesystem is canonical"; add
  a one-line pointer "Workspaces are filesystem folders
  (ADR-0017)." No invariant weakened.

## Non-goals

- This ADR does not move anything out of filesystem into DB.
- This ADR does not define user roles or membership. That is
  spec 0023 and a future workspace-permissions spec.
- This ADR does not introduce a relation/graph layer over
  resources. Types are labels, not schemas.
- This ADR does not change BlockNote's block vocabulary. Inline
  Mermaid/Excalidraw blocks inside markdown stay as-is; only the
  standalone canvas case is new, covered in the spec 0012 update.
- This ADR does not decide multi-user workspace sharing protocol —
  that is spec 0023 + a future collab spec.
