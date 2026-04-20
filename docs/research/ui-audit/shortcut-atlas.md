# Shortcut atlas

> Single source of truth for every keyboard shortcut across
> Coxinha. Compiled from specs 0005-0050 for conflict detection
> and mockup reference. Grouped by scope. Updated when a new
> spec adds a chord.
>
> Related: `shortcut-map.md` (research evidence for chord
> choices vs Windows defaults), DESIGN.md §4 (`<kbd>` styling
> rules).

## Scope tiers

- **Global OS hotkey** — registered via
  `tauri_plugin_global_shortcut`; fires even when another app
  has focus. User-configurable in `config.toml > shortcuts`.
- **In-app** — fires only when Coxinha window has focus.
- **Context-specific** — fires only in a particular widget
  (sidebar, editor, palette).

---

## Global OS hotkeys (five + three)

Win+Shift+_ pattern established in spec 0042. Plus Win+Y
as the hero two-key chord (spec 0042 review → Win+Y for
`new_note`). All under 80 % saturation in
`docs/research/shortcut-map.md`.

| Chord | Action | Spec |
|---|---|---|
| `Win+Y` | New note / Quick Capture | spec 0042 |
| `Win+Shift+C` | Show / hide Coxinha main window | spec 0042 |
| `Win+Shift+A` | Open Agenda | spec 0042 |
| `Win+Shift+M` | Open Meetings | spec 0042 |
| `Win+Shift+R` | Toggle recording | spec 0042 + spec 0007 |
| `Win+Shift+D` | Quick Capture + start dictation (one-shot) | spec 0047 |

All six user-overridable via `config.toml > shortcuts > *`.
The first five migrate from older defaults (Ctrl+Alt+*) via
`config.rs::migrate_stale_shortcut_defaults`. `Win+Shift+D` is
new in spec 0047 — no migration needed (no prior default).

---

## In-app hotkeys

### Navigation & overlays

| Chord | Action | Spec |
|---|---|---|
| `Ctrl+K` | Open command palette | spec 0043 |
| `Ctrl+P` | Open command palette (alias) | spec 0043 |
| `Ctrl+Shift+K` | Global palette (cross-workspace search) | spec 0043 (follow-up) |
| `Ctrl+/` | Open AI chat prompt (future, local-only models) | Opera-inspired, not yet specced |
| `?` | Open keyboard shortcut sheet | spec 0042 (C7) |
| `Esc` | Close overlay / dismiss suggestion | universal |

### Tabs

| Chord | Action | Spec |
|---|---|---|
| `Ctrl+T` | New tab (empty draft) | spec 0039 |
| `Ctrl+W` | Close current tab | spec 0039 |
| `Ctrl+Shift+T` | Reopen closed tab | spec 0039 |
| `Ctrl+Tab` | Next tab | spec 0039 |
| `Ctrl+Shift+Tab` | Previous tab | spec 0039 |
| `Ctrl+1..9` | Jump to tab N in current workspace | spec 0039 |

### Workspaces (Arc-inspired)

| Chord | Action | Spec |
|---|---|---|
| `Ctrl+1..9` | Switch to workspace slot 1..9 | spec 0041 (update) |
| `Ctrl+Shift+[` | Previous workspace | spec 0041 (update) |
| `Ctrl+Shift+]` | Next workspace | spec 0041 (update) |

**Conflict flag:** `Ctrl+1..9` is used for BOTH tabs (spec
0039) AND workspaces (spec 0041 update). Resolution:
- `Ctrl+1..9` = **tabs** by default
- `Ctrl+Alt+1..9` = **workspaces** (alternative)
OR
- `Ctrl+1..9` when tab focus = tabs; when sidebar focus =
  workspaces
  
**Open question in spec 0041** — needs decision before mockup.
Recommend: `Ctrl+Alt+1..9` for workspaces (avoid muscle-memory
clash with browsers).

### Modes & state

| Chord | Action | Spec |
|---|---|---|
| `Ctrl+Shift+M` | Toggle focus/compact mode | spec 0046 |
| `Ctrl+Shift+D` | Toggle dictation in Quick Capture | spec 0047 |
| `Ctrl+Shift+R` | Regenerate meeting summary (in meeting detail) | spec 0008 + E23 |

**Conflict flag:** `Ctrl+Shift+M` = meetings nav (global
Win+Shift+M) — different modifier (Ctrl vs Win), no actual
collision.
`Ctrl+Shift+R` = regenerate summary vs global `Win+Shift+R` =
toggle recording — same character, different modifier, no
collision.

### Save

| Chord | Action | Spec |
|---|---|---|
| `Ctrl+S` | Force save current note | spec 0005 |
| (autosave 500 ms) | background | spec 0005 |

---

## Context-specific

### Sidebar (with tree focus)

| Chord | Action | Spec |
|---|---|---|
| `↑` / `↓` | Move selection | spec 0045 |
| `→` | Expand folder | spec 0045 |
| `←` | Collapse folder | spec 0045 |
| `Enter` | Open selected note in current tab | spec 0045 |
| `Ctrl+Enter` | Open selected note in new tab | spec 0045 |
| `Delete` | Move to trash (with confirm) | spec 0044 |
| `Shift+Delete` | Move to trash without confirm | spec 0044 |
| `F2` | Rename selected | spec 0045 |

### Command palette (open)

| Chord | Action | Spec |
|---|---|---|
| `↑` / `↓` | Move highlight | spec 0043 |
| `Enter` | Invoke selected row | spec 0043 |
| `Shift+Enter` | Create note with typed title (force) | spec 0043 (update) |
| `Tab` | Cycle between sections | spec 0043 |
| `Esc` | Close (or back from sub-palette) | spec 0043 |

### Editor (inside BlockNote)

| Chord | Action | Source |
|---|---|---|
| `/` | Slash menu (blocks + commands + templates) | spec 0050 |
| `[[` | Wiki-link autocomplete | spec 0013 |
| `#` | Tag autocomplete | spec 0014 |
| `@` | Mention person / date / event (future) | future spec |
| `Tab` | Accept semantic link suggestion | spec 0049 |
| `Ctrl+B` / `Ctrl+I` | Bold / italic | BlockNote native |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo | BlockNote native |

---

## Changed from legacy defaults

Captures the migration history for `shared::ShortcutsConfig`
defaults. Details in `docs/research/shortcut-map.md`.

| Slot | Pre-0042 (original) | Transitional (PR #22) | Current |
|---|---|---|---|
| `new_note` | `Ctrl+Alt+N` | `Ctrl+Alt+Shift+N` → `Super+Shift+N` | `Super+Y` (Win+Y) |
| `open_app` | `Ctrl+Alt+C` | → `Super+Shift+C` | `Super+Shift+C` |
| `agenda` | `Ctrl+Alt+A` | → `Super+Shift+A` | `Super+Shift+A` |
| `meetings` | `Ctrl+Alt+M` | → `Super+Shift+M` | `Super+Shift+M` |
| `toggle_recording` | `Ctrl+Alt+R` | → `Super+Shift+R` | `Super+Shift+R` |
| `voice_capture_global` | — | — | `Super+Shift+D` (new in spec 0047) |

`config::migrate_stale_shortcut_defaults` rewrites the first
five if the whole set exactly matches a stale default.

---

## Open conflicts to resolve before implementation

1. **`Ctrl+1..9` tabs vs workspaces** — see above. Proposed
   resolution: `Ctrl+Alt+1..9` for workspaces.
2. **`F2` rename** in sidebar collides with typical "rename
   file" muscle memory; good reuse, no conflict. But note
   that `F2` inside the editor does nothing by default (would
   not fire through to sidebar since editor has focus).
3. **`Tab` accept semantic link** (spec 0049) vs `Tab` insert
   literal tab in editor — needs gating: Tab accepts only
   when a suggestion is actively visible near cursor;
   otherwise Tab inserts tab (or indents, depending on
   BlockNote config).
4. **`Ctrl+P` palette** vs browser print — browsers use
   `Ctrl+P` for print; in a desktop Tauri app this is safe to
   reassign (no browser context). Confirmed.

---

## How to extend

When a new spec adds a chord:

1. Add a row in the correct section above.
2. Check the Open Conflicts list — if the chord might
   collide, add a line documenting the resolution.
3. Cite the spec number.
4. If the chord becomes a user-override in
   `config.toml > shortcuts`, also update
   `shared::ShortcutsConfig` and the migration logic.
5. For global hotkeys, verify in
   `docs/research/shortcut-map.md` that the chord doesn't
   collide with a Microsoft-documented Windows binding.
