# Spec 0046: Focus / compact mode (Quick Capture ↔ Full shell)

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0039 (router), spec 0042 (empty-state
  editor), spec 0041 (workspaces — the compact mode inherits
  the active workspace)
- **Relevant ADRs:** ADR-0007 (tray-resident), ADR-0016
  (client shell)
- **Layer:** Outputs (window-level surface)

## Why

The Quick Capture window (spec 0042) is already the Focus mode
— a zero-chrome writing surface. Today it has one entry point
(Win+Y). This spec makes the transition **bidirectional**:

- **Win+Y from tray / any app:** spawns fresh Quick Capture
  with a blank draft. Existing behaviour.
- **Ctrl+Shift+M inside the full shell:** collapses the current
  shell to the same compact layout, **preserving the note
  currently open**. A focus mode that is not a toggle-bar but a
  window-resize.
- **Ctrl+Shift+M inside the compact window:** expands back to
  the full shell with sidebar + BacklinksPanel.

Separating "distraction-free" (collapse) from "quick capture"
(fresh draft) felt like two modes. One window + one shortcut
covers both.

## Scope

### In

- **Ctrl+Shift+M toggle** registered globally when Coxinha
  window is focused. Not a system-wide global shortcut —
  specifically an in-app hotkey.
- **Maximize / minimize icon** in the top-right of the tab bar
  (Lucide `maximize-2` when compact; `minimize-2` when full).
  Click does the same as the hotkey.
- **State machine** — the window is in exactly one of:
  - `compact` — 900×600, no sidebar, no BacklinksPanel
  - `full` — 1440×900 (or user-resized), sidebar + BacklinksPanel
- **Window resize animation** — spring stiffness 200,
  damping 25 (DESIGN.md motion). Duration ~300 ms.
  Respects `prefers-reduced-motion` (instant jump).
- **Sidebar slide** — at 150 ms into the expand, sidebar
  fades in from `opacity: 0` to `1` + `translateX(-40px)` to
  `0` over 200 ms ease-out. On collapse: reverse, 150 ms
  ease-in.
- **BacklinksPanel slide** — same curve as sidebar but from
  the right, offset by 70 ms. Hidden if current note has no
  backlinks (skip animation).
- **State persistence** — the preferred mode per workspace
  lives in `.workspace.toml` (`default_mode = "compact" |
  "full"`). Boots into the last-used mode.
- **Content preservation** — when collapsing, the current
  tab stays active with its cursor position. Saves happen
  exactly as in the full shell.
- **Keyboard:** shortcut `Ctrl+Shift+M` is the toggle.
  Documented in the keyboard shortcuts sheet (spec 0042 C7).
- **i18n:** tooltip on the maximize/minimize icon.

### Out

- **Multi-window support** — one Coxinha window at a time
  in F1. A "detach tab to new window" is out.
- **Custom sizes** — compact is fixed 900×600; full is
  whatever the user resized to. No intermediate "medium".
- **Draggable compact window title bar** — OS-native chrome
  handles drag; we don't add custom behaviour.
- **Focus mode for single routes** (e.g., Focus just inside
  Meeting detail) — different surface, follow-up.

## Behavior (acceptance)

1. **Hotkey collapses.** From the full shell with a note
   open, `Ctrl+Shift+M` animates the window to 900×600,
   hides sidebar and BacklinksPanel, current note remains
   focused with cursor preserved. Integration test with
   Tauri WebDriver or mocked window API.
2. **Hotkey expands.** From compact, `Ctrl+Shift+M` restores
   the shell. If the last-used full size is stored, restore
   to that size.
3. **Reduced motion** skips the spring — window jumps
   instantly. Vitest + CSS media query mocked.
4. **Preserved cursor.** An integration test writes 3
   characters, collapses, expands — character 4 lands in
   the expected position.
5. **BacklinksPanel skip.** A note with no backlinks: expand
   animation does NOT include the right-side panel slide.
6. **State persistence.** Collapsing, closing the app, re-
   opening — boots in compact. Integration test boot smoke
   variant.
7. **Icon mirrors state.** `maximize-2` in compact, `minimize-2`
   in full. Tooltips flip text.
8. **Budget.** Transition ≤ 350 ms end-to-end. Doesn't block
   input — typing during the animation queues up in BlockNote
   and appears after.

## Design notes

- **Tauri window API:** `Window::set_size` for resize. The
  window stays open throughout — no close/re-open.
  `set_size` is synchronous on Tauri; the animation lives
  in JS (CSS/Framer-motion-lite), driving DOM layout while
  the Tauri window size follows.
- **Animation library:** a lightweight spring primitive —
  CSS transitions aren't sufficient for the spring feel,
  but we don't need full Framer Motion. Options:
  - `@react-spring/web` — well-known, lightweight
  - `motion` (Framer Motion's lighter fork)
  - Hand-rolled with RAF + spring math (~20 lines)
  Proposed: `@react-spring/web`. Single dep, battle-tested.
- **Sidebar slide** — `transform: translateX(...)` +
  `opacity` only. No layout thrash. The main layout grid
  widens from 1-column (compact: editor only) to 3-column
  (full: sidebar + editor + BacklinksPanel). Grid transition
  is an animated template-columns.
- **Window state** lives in `useWindowModeStore` (Zustand).
  Two atoms: `mode: "compact" | "full"` + `lastFullSize:
  { w: number, h: number }`.
- **Maximize icon placement:** between the `+` new-tab and
  the close-x of the active tab. Small visual affordance,
  not a button dominance.
- **Compact from a `.pen` mockup standpoint:** it's the
  existing Quick Capture frame. No new frame needed — just
  confirm the transition frames exist.

## Open questions

- **Should Ctrl+Shift+M from compact with no active note
  (fresh draft state) expand, or stay in compact?**
  Proposed: expand. Consistent toggle.
- **What if the current window was user-resized (dragged)
  and the user presses Ctrl+Shift+M?** The "last full size"
  should be the dragged size, not 1440×900. Verify the
  Tauri `Window::outer_size` returns what we expect.
- **Spring feels fast on high-DPI Windows vs Linux?**
  Cross-check the spring numbers. 200/25 might need per-
  platform tuning.
- **Third state** — maximized (full-screen). User could
  press Win+Up to maximize. Not our shortcut; we respect
  OS-level maximize without interfering.

## Test plan summary

- **Vitest**: state machine transitions, reduced-motion
  path, cursor preservation, icon flip.
- **Integration**: Tauri window resize round-trip.
- **Manual**: visual QA of the spring feel on Windows 11.
