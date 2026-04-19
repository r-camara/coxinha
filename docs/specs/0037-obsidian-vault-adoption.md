# Spec 0037: Obsidian vault adoption

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** 0010 (Settings)
- **Relevant ADRs:** ADR-0002 (local-first), ADR-0007 (tray-resident)

## Why
CLAUDE.md says "filesystem is canonical" and "any Markdown editor
opens the vault." That's only true in practice if a user who
already lives in Obsidian can point Coxinha at the vault they
already have. Spec 0015 covers one-shot import; this spec covers
*adopting* an existing vault as Coxinha's working directory so
notes, meetings, and attachments live alongside the user's
existing Obsidian files.

## Scope

### In
- Detect installed Obsidian vaults on Windows by reading the
  user's global Obsidian config:
  `%APPDATA%\obsidian\obsidian.json` → field `vaults` (id → path).
- Backend IPC command `list_obsidian_vaults() -> Vec<ObsidianVault>`
  that returns `{ id, name, path, last_opened_ms, exists }`,
  sorted most-recently-opened first.
- Settings view (spec 0010, Appearance or a new "Vault" tab) lists
  detected vaults with radio-select. Selecting one rewrites
  `vault_path` in `config.toml`.
- On vault switch: shut the current DB, bootstrap the new vault
  path (create `notes/`, `meetings/`, `attachments/`, `daily/`,
  `.coxinha/`), open a fresh `.coxinha/index.db`, rebuild the
  index from the Markdown files already in the folder.
- `.coxinha/` directory inside an adopted vault must stay invisible
  to casual Obsidian users: add `.obsidian-ignore` style hint in
  docs, and keep the folder name dot-prefixed.

### Out
- Bi-directional sync with Obsidian plugins → out of F1.5.
- Importing attachments from Obsidian's `attachments/` setting
  when different from our default → spec 0015 handles that flow.
- macOS / Linux detection — follow-up spec. Path lookup exists
  (`directories::BaseDirs::config_dir()` gives the right root on
  all three), but only Windows is validated for F1.

## Behavior (acceptance)
- With Obsidian installed and ≥1 vault registered, the Settings
  "Vault" list is non-empty and shows each vault's name + full
  path + relative "last opened" label.
- With Obsidian not installed, `list_obsidian_vaults()` returns
  `[]` and the Settings list shows an empty state — no error,
  no toast.
- Picking a vault → Save → restart not required → next
  `list_notes` call surfaces the `.md` files under the adopted
  vault's `notes/` folder.
- Adopted vault where `notes/` did not exist: Coxinha creates it
  on first use; the user's existing `.md` files at the vault root
  are picked up by `rebuild_from_vault` (spec 0004).
- `.coxinha/config.toml` and `.coxinha/index.db` land inside the
  adopted vault, not in `~/coxinha/`.

## Design notes
- New Rust module `src-tauri/src/obsidian.rs` parses
  `obsidian.json`. Never writes it.
- Shared type `ObsidianVault` gets added to `shared` so the
  frontend binds to a typed list.
- On vault switch, reuse the existing `AppState::update_config`
  path; extend it to trigger re-bootstrap + re-index when
  `vault_path` differs from the current one.
- Settings UI uses `shadcn` table or radio group; Save disabled
  until selection differs from current.

## Shipped (as of 2026-04-18)

- `obsidian::detect_vaults()` reads
  `%APPDATA%\obsidian\obsidian.json`, returns `ObsidianVault[]`
  sorted most-recently-opened-first, tolerates "no Obsidian
  installed" (returns `[]`).
- IPC command `list_obsidian_vaults()` exposed via specta.
- Settings view renders the list with radio picker, "custom
  path" input, Save button, load/save error surfacing.
- 6 parse tests (Windows sample, exists flag, empty, missing
  field, malformed JSON, detect without config).

## Still open

- **Vault switch re-bootstrap**: Save writes the new
  `vault_path` but `AppState::update_config` does NOT re-open
  the DB, re-bootstrap the vault tree, or re-index. The UI
  surfaces a "restart required" toast; the real switch is a
  follow-up that depends on `rebuild_from_vault` (spec 0004).
- macOS / Linux UI flows — path resolution already works
  (`BaseDirs::config_dir()` returns the right root), but
  Windows-first validation is all we've done.

## Open questions
- Should we auto-switch to "Obsidian-compatible" vault layout
  (notes at vault root, not under `notes/`) when adopting? Vote
  No for F1.5 — keeping our subfolder layout means Obsidian shows
  the same tree and no existing file moves. Revisit if users push
  back.
- Whether to write a minimal `.obsidian/app.json` snippet so an
  Obsidian instance opening the same folder hides `.coxinha/` by
  default. Defer: that couples our app to Obsidian's internal
  schema, which we don't control.
