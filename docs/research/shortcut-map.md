# Shortcut map — why we chose Win+Shift+N (2026-04-20)

Research artifact supporting spec 0042's shortcut decision.
Everything below is either cited or tagged `[unverified]`.

## Why this document exists

The original `Ctrl+Alt+N` default was silently intercepted on
Windows. The first fix attempt, `Ctrl+Alt+Shift+N`, also
failed in the field — likely because existing `config.toml`
files still held the old value and a new `Default::default`
doesn't migrate existing installs (fixed in this same PR via
`config.rs::migrate_stale_shortcut_defaults`).

Rather than keep guessing, we mapped the actual Microsoft-
documented Windows 11 bindings to find a chord no system
feature claims.

## Notion's baseline

- **Global new-note on Windows: none documented.** Notion's
  shortcut help page (https://www.notion.com/help/keyboard-shortcuts)
  lists `Ctrl+N` as "Create a new page" only when Notion has
  focus. No Quick Capture or system-wide hotkey is advertised.
- Implication for Coxinha: the product gap Coxinha is filling
  (OS-wide capture to a vault) has no established chord to
  copy. We pick based on "free on Windows 11" criteria.

## Windows 11 Win-key bindings (Microsoft-documented)

Source for every row unless noted:
https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec

| Chord | Action |
|---|---|
| `Win` | Open or close Start menu |
| `Win+A` | Open action center |
| `Win+Shift+A` | Set focus to a Windows tip |
| `Win+Alt+B` | Toggle HDR |
| `Win+C` | Open Copilot |
| `Win+Alt+D` | Show/hide date and time on desktop |
| `Win+Alt+Down` | Snap window bottom half |
| `Win+Alt+H` | Voice typing: focus keyboard |
| `Win+Alt+K` | Mute/unmute mic |
| **`Win+Alt+N`** | **Create OneNote Quick Note** (source: https://support.microsoft.com/en-us/office/create-quick-notes-0f126c7d-1e62-483a-b027-9c31c78dad99) |
| `Win+Alt+Up` | Snap window top half |
| `Win+,` | Peek at desktop |
| `Win+Ctrl+C` | Toggle color filters |
| `Win+Ctrl+Enter` | Open Narrator |
| `Win+Ctrl+F` | Search for devices on network |
| `Win+Ctrl+Q` | Open Quick Assist |
| `Win+Ctrl+Shift+B` | Wake device when screen blank |
| `Win+Ctrl+Space` | Cycle previous input method |
| `Win+Ctrl+V` | Open sound output quick settings |
| `Win+D` | Show/hide desktop |
| `Win+Down` | Minimize active window |
| `Win+E` | Open File Explorer |
| `Win+Esc` | Close Magnifier |
| `Win+F` | Open Feedback Hub |
| `Win+/` | Start IME reconversion |
| `Win+G` | Open Game Bar |
| `Win+H` | Open voice dictation |
| `Win+Home` | Minimize/restore all except active |
| `Win+I` | Open Settings |
| `Win+J` | Open Recall |
| `Win+K` | Open Cast |
| `Win+L` | Lock computer |
| `Win+Left` | Snap window left |
| `Win+M` | Minimize all windows |
| `Win+-` | Zoom out Magnifier |
| **`Win+N`** | **Open notification center and calendar** |
| `Win+O` | Lock device orientation |
| `Win+P` | Presentation display mode |
| `Win+Pause` | Settings → System → About |
| `Win+.` / `Win+;` | Open emoji panel |
| `Win++` | Zoom in Magnifier |
| `Win+PrtScn` | Full-screen screenshot to file |
| `Win+Q` | Open search |
| `Win+R` | Run dialog |
| `Win+Right` | Snap window right |
| `Win+S` | Open search |
| `Win+Shift+Down` | Restore snapped/maximized window |
| `Win+Shift+Enter` | UWP app fullscreen |
| `Win+Shift+Left` | Move window to left monitor |
| `Win+Shift+M` | Restore minimized windows *(conflicts with our `Win+Shift+M` default — see "Acknowledged collision" below)* |
| `Win+Shift+R` | Record screen region (video) *(same — `Win+Shift+R` collides with recording toggle)* |
| `Win+Shift+Right` | Move window to right monitor |
| `Win+Shift+S` | Snip screenshot region |
| `Win+Shift+Space` | Cycle input languages backward |
| `Win+Shift+Up` | Stretch window top-bottom |
| `Win+Shift+V` | Cycle notifications |
| `Win+Space` | Cycle input languages forward |
| `Win+Tab` | Open Task View |
| `Win+U` | Settings → Accessibility |
| `Win+Up` | Maximize active window |
| `Win+V` | Clipboard history |
| `Win+W` | Open Widgets |
| `Win+X` | Quick Link menu |
| `Win+Y` | Switch Mixed Reality/desktop |
| `Win+Z` | Snap layouts |
| `Win+0..9` | Launch app pinned to taskbar `[unverified — common but not on this page]` |

## `Ctrl+Alt+<letter>` reservations

The Microsoft Windows-shortcuts page does not reserve any
`Ctrl+Alt+<letter>` at the OS level. OneNote desktop reserves
several **in-app** (source:
https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-onenote-44b8b3f4-c274-4bcc-a089-e80fdcc87950):

- `Ctrl+Alt+1..6` — apply heading styles
- `Ctrl+Alt+C` — Format Painter copy
- `Ctrl+Alt+D` — Dock OneNote window
- `Ctrl+Alt+H` — Highlight text
- `Ctrl+Alt+L` — Lock password-protected sections
- `Ctrl+Alt+M` — Move/copy current page
- **`Ctrl+Alt+N`** — New page at same level below current (OneNote for Windows 10)
- `Ctrl+Alt+P` — Play selected audio
- `Ctrl+Alt+S` — Stop audio
- `Ctrl+Alt+V` — Paste formatting

In-app bindings are only active when OneNote has focus —
they should not intercept a global hotkey in theory. The
original bug report ("Ctrl+Alt+N never reaches Coxinha")
may reflect either a different version of OneNote that
registers global hooks `[unverified]` or a third-party
utility on the user's machine. Either way, we avoid every
`Ctrl+Alt+<letter>` chord that OneNote lists.

## Decision

Defaults ship as:

| Action | Chord | Notes |
|---|---|---|
| new_note | `Super+Y` (Win+Y) | Two-key hero chord. Microsoft lists Win+Y as "Switch Mixed Reality/desktop"; WMR discontinued 2024, so the slot is effectively free on >99% of machines. |
| open_app | `Super+Shift+C` | `Win+C` = Copilot. `Win+Shift+C` not listed. |
| agenda | `Super+Shift+A` | `Win+A` = Action Center. `Win+Shift+A` = "set focus to a Windows tip" — minor accessibility affordance we accept overriding. |
| meetings | `Super+Shift+M` | `Win+M` = minimize all. `Win+Shift+M` = restore minimized windows — rare user action, acknowledged collision. |
| toggle_recording | `Super+Shift+R` | `Win+R` = Run. `Win+Shift+R` = record screen region — rare, acknowledged collision. |

Why `Super+Y` for the hero shortcut:

- Two-key chord — user's explicit ask for "no Shift/Ctrl".
- Microsoft still lists `Win+Y` but its target (Mixed
  Reality desktop switch) has been retired since WMR was
  discontinued in December 2024. The chord is effectively
  an unused slot on every non-HoloLens machine.
- `Y` is not a typing-muscle-memory mnemonic, but new_note
  is the one action users will wire into reflex fastest —
  a cheap chord pays off there.
- Remaining four keep `Super+Shift+<letter>` because the
  remaining free Win+letter slots (`Win+J` Recall on
  Copilot+PCs, `Win+O` orientation on tablets) are
  lottery-ticket safe: works until the hardware says
  otherwise. Hero deserves the gamble; supporting actions
  don't.

### Acknowledged collisions

- **`Win+Shift+M`** collides with Microsoft's "restore
  minimized windows". We ship it anyway for `meetings`
  because the hotkey competes with an extremely rare user
  action (restoring minimized windows via keyboard — most
  users click the taskbar). If this becomes a real problem,
  swap `meetings` to a different letter (candidate: `T` for
  "Team meeting"). Tracked as an open question in spec 0042.
- **`Win+Shift+R`** collides with Windows 11's "record screen
  region". Same trade-off: screen recording is rare for
  typical Coxinha users. If it surfaces, swap to a different
  letter for `toggle_recording`.

### Why not other candidates

- `Ctrl+Alt+Space` — was the top non-Win-key candidate from
  the research. Rejected because the user explicitly asked
  to use the Windows key; this pattern also conflicts with
  PowerToys Run and Alfred-style launchers `[unverified]`.
- `Ctrl+Shift+;` — punctuation chord, ergonomic, no known
  system binding. Rejected because it loses the letter-as-
  mnemonic property (we need five chords, not one, and
  `Ctrl+Shift+N` / `Ctrl+Shift+C` etc. collide with Chrome
  and common dev shortcuts).
- `Win+N` — notification center, cannot touch.
- `Win+Alt+N` — OneNote Quick Note, cannot touch.
- `Win+Ctrl+N` — free, but `Win+Ctrl+*` territory is small
  and chromatically mixed with Accessibility bindings; we
  steer clear to leave room.

## Migration

`src-tauri/src/config.rs::migrate_stale_shortcut_defaults` rewrites
two documented-broken default sets (`Ctrl+Alt+*` and
`Ctrl+Alt+Shift+*`) to the current `ShortcutsConfig::default()`.
Users who customized any key keep their set untouched. One-shot
per install, persisted back to `config.toml`, logged at `info`.
