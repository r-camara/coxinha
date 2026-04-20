# Spec 0043: Command palette (`Ctrl+K`)

- **Status:** draft
- **Phase:** F1 (housekeeping UX, lands with or after spec 0039)
- **Owner:** Rodolfo
- **Depends on:** spec 0039 (router), spec 0005 (notes + FTS),
  spec 0041 (workspaces) — optional integration
- **Relevant ADRs:** ADR-0013 (a11y), ADR-0016 (client shell)
- **Layer:** Outputs (UX surface over Knowledge + Memory)

## Why

Every modern notetaker has `Ctrl+K`. Obsidian has two (command
palette + quick switcher); Notion has one (search-first). We
land one unified palette: fuzzy across pages + action launcher +
shortcut teacher. No separate "command mode" vs "search mode".

Without it, the keyboard-first UX is a lie — users fall back to
clicking sidebar items. With it, the whole app becomes reachable
without the mouse.

## Scope

### In

- **Hotkey:** `Ctrl+K` (also `Ctrl+P` as alias — matches Obsidian
  muscle memory). Works from any route. Closes on `Esc` or
  backdrop click.
- **Overlay surface:** full-width dialog, max 640 px,
  vertically 25 % from top. Backdrop scrim (Coffee Ink at 40 %
  opacity). Respects reduced-motion.
- **Input:** single text field, autofocus. Placeholder "Search
  or run a command…" with subtle `Ctrl+K` kbd pill on the
  right (fades as user types).
- **Results (live, debounced 80 ms):** three sections, in order:
  1. **Pages** — fuzzy match over note titles + first 80
     chars of body (FTS5). Max 7. Each row: title + snippet
     with matched span highlighted + small path breadcrumb.
  2. **Actions** — matched over a fixed registry:
     - New note
     - New daily note
     - Switch workspace → <opens workspace sub-palette>
     - Rebuild index
     - Toggle theme
     - Open Settings
     - Start / stop recording
     - Open trash
  3. **Shortcuts help** — the chord for whatever is matched.
     e.g., typing "agen" surfaces `/agenda` + the chord
     `Win+Shift+A`.
- **Keyboard nav:** `↑` / `↓` / `Enter` / `Tab` for section
  hopping. Mouse also works.
- **Empty state inside palette:** shows a short "Recently opened"
  list (last 5 notes) + the top 3 actions.
- **Sub-palette flow:** "Switch workspace" → second palette
  layer listing workspaces (icon + name + note count). `Esc`
  goes back to parent palette, not closed.
- **Registration:** actions registered via a typed
  `CommandRegistry` module. New actions register by calling
  `registerCommand({ id, label, run })`. Future features
  (spec 0044 trash, spec 0045 tree, share modal) add their
  actions there.
- **I18n:** every command label + placeholder is an i18n key.

### Out

- **AI-powered search** (semantic) — spec 0049 once embeddings
  exist (spec 0030).
- **In-page actions** (turn block into X, format selection). Those
  stay on BlockNote's slash menu — different surface.
- **Cross-workspace search** — palette searches the **active**
  workspace only. Global search is a future follow-up.
- **File system actions** (open file picker, import folder).
  Settings has them; palette doesn't.
- **Web-mode palette** — spec 0022's read-mostly web UI gets a
  simplified palette in a follow-up.

## Behavior (acceptance)

1. **Hotkey opens.** `Ctrl+K` from any route opens the palette
   within one frame (budget: 16 ms). Vitest asserts keydown
   handler triggers open state.
2. **Escape closes.** `Esc` closes without side-effects.
3. **Backdrop click closes.** Clicking outside the dialog closes.
4. **Search is debounced.** Typing "quick brown fox" fires one
   FTS query after 80 ms idle — not 15 per keystroke. Spied in
   Vitest.
5. **Pages + actions share keyboard nav.** Pressing `↓` moves
   through all rows regardless of section. Enter on a page
   navigates to `/notes/$id`; Enter on an action fires `run()`.
6. **Sub-palette back-nav.** Opening "Switch workspace" then
   pressing `Esc` returns to the main palette, not full close.
7. **Shortcut mirror.** Typing the full label of a route
   (e.g., "Meetings") surfaces the route AND its chord
   (`Win+Shift+M`). The chord is shown in mono kbd styling
   inline.
8. **A11y.** Focus trap within the dialog while open.
   `aria-expanded` / `role="combobox"`. All rows are buttons
   with `aria-label`.
9. **Budget.** Palette open-to-first-paint ≤ 100 ms. FTS
   response ≤ 50 ms for a 1 k-note vault (spec 0003 budget).

## Design notes

- **shadcn `Command` primitive** (`cmdk`) — the spec 0042
  follow-up primitive landing was explicitly for this. Adopt
  the shadcn `Command` surface, skin to `DESIGN.md` tokens.
  The internal menu uses `CommandInput`, `CommandGroup`,
  `CommandItem`, `CommandShortcut`.
- **Action registry** lives in `src/features/palette/registry.ts`
  — a Zustand store `useCommands()` exposes
  `register/unregister/list`. Features self-register on mount
  and cleanup on unmount.
- **FTS debounce** reuses the 150 ms pattern already in
  Sidebar search; for palette we tighten to 80 ms because
  the palette is more "impatient" surface.
- **Visual:** Canvas background, 1 px `$color-whisper-line`
  border, `radius-lg`, soft shadow (token
  `--shadow-lg` from spec 0042 primitives). Section headings in
  the 10 px Geist uppercase pattern used across the sidebar.
- **Shortcut kbd inline** reuses the `<kbd>` component from
  `DESIGN.md` section 4.
- **Workspace sub-palette** shares the same component, different
  command source. One animation: sub-palette slides up with
  120 ms ease-out while parent fades to 60 % opacity.
- **Command icons:** Lucide. Actions get small left icons
  (FileText, Settings, Moon, Mic, Trash). Pages don't — their
  title is the identifier.

## Open questions

- **Fuzzy algorithm:** `fzf`-style sublime-fuzzy vs `cmdk`'s
  built-in? Proposed: start with cmdk default, revisit if we
  hit "should have ranked X higher" reports.
- **Recently opened persistence:** in-memory (session) vs
  persisted to `config.toml`? Proposed: session-only for F1;
  upgrade to persisted if users ask.
- **Global vs per-workspace** search scope — per-workspace by
  default, `Ctrl+Shift+K` for global (searches across all
  workspaces) is an optional follow-up.
- **"Show all pages" overflow:** when more than 7 pages match,
  add a "Show all N matches" row that expands the list in
  place. Or should Enter on that row route to `/notes` with
  the query? Proposed: in-place expansion, route option for
  a future iteration.

## Test plan summary

- **Vitest**: open/close keyboard, debounce, section nav,
  action fires, sub-palette back-nav, focus trap.
- **Unit**: command registry (register/unregister,
  duplicate-id rejection, order preservation).
- **Integration**: FTS round-trip under 50 ms on a 1 k-note
  fixture.
- **Manual**: screenshot the palette in both empty and
  populated states; make sure the reduced-motion path does
  not animate.
