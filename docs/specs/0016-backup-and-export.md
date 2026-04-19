# Spec 0016: Vault backup & export

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0005 (notes)
- **Relevant ADRs:** ADR-0002

## Why
"Export everything before I do something risky" and "where's my
backup?" are basic expectations of an app that owns user data.
Local-first doesn't mean users have to manage backups by hand.

## Scope

### In
- `export_vault(dest: &Path)` command → writes a
  `coxinha-YYYY-MM-DD.zip` containing every file under
  `~/coxinha/` except `index.db` (rebuildable)
- Scheduled daily backup at a user-chosen time to a user-chosen
  folder, configurable in Settings (spec 0010)
- Rolling retention: keep last 7 daily + last 4 weekly by default
- "Restore from zip" in Settings — picks a zip, confirms the
  destructive overwrite, replaces the vault, triggers
  `rebuild_from_vault`

### Out
- Cloud backup → F2 sync
- Incremental / delta backups (full zip works up to ~1GB vaults)
- Encrypted archives → optional passphrase in F2

## Behavior (acceptance)
- Export of a 1000-note + 50-meeting vault finishes in <10s on SSD
- Restore from yesterday's export reconstructs notes and meetings
  byte-identically (except `index.db` which rebuilds)
- Scheduled backup runs at the configured time even if the user
  was AFK; logs success/failure to `~/coxinha/.coxinha/logs/`
- Retention prunes older archives without prompting
- Export while a recording is active: queues until the recording
  stops (don't break the WAV)

## Design notes
- Use the `zip` crate (sync) inside `tokio::task::spawn_blocking`
- Default backup folder: `~/Documents/CoxinhaBackups/` on Windows,
  `~/Documents/CoxinhaBackups` on mac/Linux
- Skip `index.db`, `*.db-wal`, `*.db-shm`, and `.coxinha/logs/`

## Open questions
- Include `~/coxinha/.coxinha/config.toml`? Yes — settings are
  part of the vault.
- Encrypt by default? No — adds UX weight; passphrase opt-in in F2.
