# Spec 0044: Trash with retention window

- **Status:** draft
- **Phase:** F1 (data-safety blocker)
- **Owner:** Rodolfo
- **Depends on:** spec 0005 (notes), spec 0041 (workspaces —
  trash is workspace-scoped)
- **Relevant ADRs:** ADR-0002 (local-first, filesystem canonical)
- **Layer:** Knowledge (soft-delete surface over existing notes)

## Why

Today `delete_note` in `storage.rs` is destructive — it removes
the Markdown file and the DB row. No undo. A misclick on a
two-year-old note with no backup is a permanent loss.

Every Markdown notetaker in the benchmark has a Trash: Notion's
30-day trash, Obsidian's "Move to trash" plugin / system trash,
Mem's recoverable archive. Ours can't ship past F1 without one
— it's a data-safety invariant, not a convenience.

## Scope

### In

- **Soft delete as the default.** `delete_note` moves the file
  to `workspaces/$ws/.trash/<uuid>.md` and updates its DB row
  with `deleted_at` timestamp + `deleted_from_path`.
- **Retention window:** 30 days default. Configurable per
  workspace in `.workspace.toml`: `trash_retention_days = 30`.
  Set to `0` to disable auto-purge (items live until manually
  emptied).
- **Auto-purge:** on app boot + once a day after, scan
  `.trash/` and permanently remove files older than
  `retention_days`. Log to `history.jsonl`. Never purge during
  an active editing session silently — skip if the note is
  currently open.
- **Trash UI:** accessible from the sidebar footer (icon-only
  button beside Settings) **and** from the command palette
  ("Open trash" action). Opens as a full route
  `/trash` (workspace-scoped) showing a list:
  - Title · deleted-at (mono relative time) · original path
  - Filter dropdown: all / last 7 days / last 30 days
  - Row action: Restore (primary) · Delete permanently (red
    text, confirm dialog)
  - Top toolbar: "Empty trash" (confirms, purges everything)
- **Restore semantics:** restoring writes the file back to
  `deleted_from_path`.
  - If the parent folder of the original path no longer exists
    (user deleted `projects/` while the note was in trash),
    the parent folder is re-created automatically.
  - If the original path is now taken (a note with same UUID
    was re-created, or a new file was created at the same
    path by an external editor), suffix with `-restored` on
    the title and `-restored-N` on the filename if N>1.
- **Keyboard:** `Delete` in the sidebar note list moves to
  trash with a confirm; `Shift+Delete` skips confirm.
- **Exclude trash from FTS.** Deleted notes don't appear in
  search, don't appear in `list_notes`, don't count in tag
  counts.
- **Attachments:** when a note is trashed, referenced
  attachments remain on disk (other notes may still link to
  them). Orphan attachment cleanup is its own follow-up spec.
- **i18n:** all labels keyed.

### Out

- **Version history within a note** — that is Yjs snapshots
  from spec 0021, different surface.
- **Trash for meetings / canvases** — first iteration covers
  notes only; meeting recordings (large audio files) and
  canvases follow same pattern in a later iteration.
- **Per-note retention override.** Flat per-workspace in F1.
- **Remote trash sync** — spec 0020 (sync client) handles
  delete events in its own way; this spec is local-only for F1.

## Behavior (acceptance)

1. **Delete moves, not removes.** `delete_note(id)` on a note
   results in the file being moved to `.trash/`, the DB row
   updated with `deleted_at` (not removed). Rust unit test on
   `storage::delete_note`.
2. **Trash row appears.** After a delete, `/trash` route
   shows the row. Vitest integration test with a fixture.
3. **Restore reappears.** Clicking Restore returns the file
   to its original path, the DB row clears `deleted_at`, the
   sidebar refetches and the note shows up. Round-trip Rust
   test.
4. **Path collision on restore** appends `-restored`. Test
   with a fixture where the UUID is the same but path is
   occupied.
5. **Retention purge.** An integration test seeds a trash
   file with mtime 31 days ago, runs the purge routine,
   asserts the file is gone and a `history.jsonl` line was
   appended. Retention=0 disables.
6. **Search excludes trash.** `search_notes("foo")` with
   a trashed note that contains "foo" returns zero hits.
7. **Boot-time purge is non-blocking.** Boot-ready budget of
   2 s (spec 0003) stays green even with 500 items in trash
   (typical pre-purge load).
8. **Keyboard shortcut** fires the same flow.

## Design notes

- **Directory per workspace:** `workspaces/$ws/.trash/` — the
  leading `.` hides it from normal walks in `rebuild_from_vault`
  unless `include_trash=true` is passed.
- **DB schema:**
  - `notes.deleted_at` TEXT NULL (ISO-8601 UTC)
  - `notes.deleted_from_path` TEXT NULL (absolute path relative
    to workspace root)
  - Index on `(workspace_id, deleted_at IS NOT NULL)` for fast
    trash listing.
  - FTS5 index filter excludes rows where `deleted_at IS NOT NULL`.
- **Vault invariant preserved.** The `.trash/` folder is still
  part of the filesystem — Obsidian / any editor opens it if
  the user wants to recover manually. We don't hide data from
  the user.
- **Audit trail:** each delete / restore / purge appends a line
  to `.coxinha/history.jsonl` per ADR-0017 pattern:
  `{ts, actor: "user" | "purge", op: "trash" | "restore" | "purge", note_id, path_before, path_after?}`.
- **UI surface** is the same sidebar pattern as the rest — no
  modal. `/trash` is a proper route with `__root` shell around
  it. Tab bar shows "Trash" as a closable tab.
- **Confirm dialog for permanent delete** uses the Alarm Red
  primary button from `DESIGN.md`.

## Open questions

- **Sidebar footer icon position** — before or after Settings?
  Proposed: after, since Trash is rarer visit.
- **Should the Recent list in sidebar ever show trashed
  items** (greyed)? Proposed: no. Hard line — trashed is
  invisible until Trash is opened.
- **Keyboard:** should `Delete` require a modifier to avoid
  accidental presses while editing? Proposed: yes — context-
  aware. `Delete` only triggers trash when note list has
  focus. Inside the editor, `Delete` is text-delete as
  normal.
- **Empty trash confirmation wording** — default to strict
  ("This permanently deletes 12 notes. This cannot be undone.
  Type DELETE to confirm.") vs lenient (single button with
  timeout). Proposed: strict only when >10 items OR any item
  older than 30 days; otherwise single confirm.

## Test plan summary

- **Rust**: `storage::delete_note` move semantics,
  `storage::restore_note` path-collision, purge routine,
  boot-path non-blocking, FTS exclusion.
- **Vitest**: UI list render, Restore button fires IPC,
  confirm dialog behaviour, empty state.
- **Integration** (existing `perf_new_note.rs` style):
  trash-under-load — boot with 500 trash items, assert ready
  within budget.
