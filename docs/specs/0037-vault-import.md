# Spec 0037: Vault import

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0001 (notes), spec 0010 (search)
- **Relevant ADRs:** ADR-0002

## Why
Power users arrive with an existing Obsidian/Logseq/plain-markdown
vault. Asking them to retype years of notes is a non-starter; the
import flow is a hard gate for adoption by that segment.

## Scope

### In
- Settings → "Import from folder" → OS folder picker
- Scan recursively for `.md` files; collect referenced attachments
  (images, `.excalidraw.json`, etc.)
- Copy markdown into `~/coxinha/notes/<subpath>/<filename>.md`
  (preserves relative structure)
- Copy attachments into `~/coxinha/attachments/`; rewrite links
  when necessary
- Progress UI (files counted / total, current file, cancel button)
- After import: call `rebuild_from_vault` so FTS5 picks up the new
  content immediately
- Dedupe: skip files whose content hash already exists in the
  vault

### Out
- Import from Notion/Evernote/HTML → separate spec, F2+
- Live two-way mirror with the source folder → F3+
- Merging with an existing Coxinha vault (vs first-run empty) —
  possible but prompts the user to confirm

## Behavior (acceptance)
- 1000-note Obsidian vault + 200 images import in <30s on SSD
- Imported notes searchable immediately after import finishes
- Canceling partway leaves a consistent state (no dangling DB
  rows referencing missing files)
- Running the import again on the same source is a no-op (dedup)

## Design notes
- Backend: `import_vault(src_path) -> Uuid` returning an
  operation id; progress via `VaultImportProgress` typed event
- Walk with `walkdir`; parse markdown minimally (regex for
  `![alt](path)` and `[[wiki]]` references)
- Preserve source `mtime` as the new note's `updated_at`

## Open questions
- `frontmatter:` YAML in Obsidian notes — keep, strip, or convert
  to Coxinha tags? Keep as-is (markdown files are canonical); the
  title-from-first-heading logic already ignores it.
- Import of files Coxinha doesn't own (e.g. `.canvas`)? Copy
  as-is; non-markdown files stay addressable.
