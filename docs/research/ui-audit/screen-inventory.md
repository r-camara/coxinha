# Coxinha screen inventory

> Master doc listing every UI surface — screens, modals, overlays,
> ambient moments, key interactions — across the whole product.
> Source of truth for mockup coverage and spec completeness.
>
> Paired with `DESIGN.md` (the aesthetic doctrine) and the
> research docs in this folder (`notion-flow-inventory.md`,
> `obsidian-flow-inventory.md`, `granola-flow-inventory.md`,
> `type-model-benchmark.md`, `shortcut-map.md`).

## Legend

| Mark | Meaning |
|---|---|
| **✓** | Mocked (in `mockups/coxinha.pen` + exported PNG) |
| **→** | Queued for next mockup wave |
| **◊** | Deferred — depends on a spec not yet drafted / F2+ |
| **×** | Not on roadmap (documented-out per ADR/spec) |

Spec anchors use the form `spec 00XX` pointing at
`docs/specs/00XX-*.md`. `new` means the spec is drafted in this
same round (0043–0048).

---

## A. Shell primitives

The chrome around every route. Stable across screens; design
tokens in `DESIGN.md`.

| # | Surface | Spec | Design note | Mock |
|---|---|---|---|---|
| A1 | Window chrome | spec 0001 | OS-native title bar (no custom draggable region). Tray-resident per ADR-0007. Closing hides; real quit from tray menu. | ◊ (OS-rendered) |
| A2 | **IconRail** (48 px, icons only) | spec 0005 + spec 0052 | Widened to 48 px for the Mix B Refined shell (2026-04-21). Four nav icons (file / calendar / mic / search), flex spacer, theme toggle + settings at the bottom. Active state uses a soft tangerine tint (`accent / 0.08`). Discovery of notes lives in the command palette | ✓ implemented |
| A3 | **ChromeBar** (52 px, breadcrumb + Saved indicator) | **spec 0052** | New surface introduced by Mix B Refined. Breadcrumb trail on the left (`notes / untitled.md`), Saved indicator slot on the right (`• Saved`). Rendered by every route via `<RouteLayout>` | ✓ implemented |
| A3b | **StatusBar** (36 px footer) | **spec 0052** | New surface. Renders under editing routes with word count / save state on the left, optional meta on the right | ✓ implemented |
| A4 | Workspace switcher | spec 0041 + new spec 0046 | Opera-style icon rail in the sidebar top (per spec 0041 update). Rail shows up to 9 workspace icons with `Ctrl+Alt+1..9` shortcuts | → |
| A5 | Command palette overlay (`Ctrl+K`) | **spec 0043** | Implemented 2026-04-21. Actions + fuzzy note search + shortcuts help in one overlay. `Ctrl+K` / `Ctrl+P` / Esc wired. Translated from the Claude Design handoff's CommandPalette.jsx | ✓ implemented |
| A6 | Empty-state editor | spec 0042 | `/notes` renders the BlockNote editor directly on a transient draft in a 760 px-max reading column. The native placeholder (`Enter text or type '/' for commands`) is the only affordance | ✓ implemented |
| A7 | Save indicator | spec 0042 + spec 0052 | Tangerine live-dot (6 px) in the chrome bar's right slot. Orange replaces the interim sage accent per the Mix B Refined handoff (2026-04-21) | ✓ implemented |
| A8 | Focus / compact mode | new **spec 0046** | Ctrl+Shift+M collapses the full shell to the 900×600 compact window. Reverse toggles back | → |
| A9 | **AI Assistant rail + panel** | spec 0051 + spec 0052 | Always-visible 48 px `ASK` rail (sparkles icon + vertical label) that expands to a 320 px panel on click or ⌘J. Panel layout unchanged: LINK SUGGESTIONS / RELATED sections + Ask input. Implemented 2026-04-21 | ✓ implemented |

## B. Content screens

The routes. Each mounts under `__root` per ADR-0016.

| # | Surface | Route | Spec | Design note | Mock |
|---|---|---|---|---|---|
| B1 | Notes · writing / detail | `/notes/$id` | spec 0005 | BlockNote editor in the 720 px reading column, BacklinksPanel on the right (256 px). Meta row under title: `Created {date} · Saved •` with save-dot | ✓ |
| B2 | Notes · index (empty state) | `/notes` | spec 0042 | Full-bleed editor on transient draft. See A6 | ✓ |
| B3 | Quick capture | hotkey-only window (Win+Y) | spec 0042 | 900×600 floating window. **No sidebar, no BacklinksPanel** — only tab bar + editor. Notepad/Obsidian-clean | ✓ |
| B4 | Agenda · today | `/agenda` | spec 0006 + spec 0009 | Daily note open in a tab ("Hoje — $date"). Tasks section, bullets, cursor. BacklinksPanel kept. Per-day navigation via **calendar strip** (→ new spec 0048) | ✓ (basic) |
| B5 | Calendar integration strip | `/agenda` (part of B4) | new **spec 0048** | Horizontal scroll of last 14 days above the daily note. Each day: dot sized/colored by note density. Click jumps to that day's daily note. Plus OS-calendar events for today as small chips | → |
| B6 | Meeting detail | `/meetings/$id` | spec 0008 + 0009 | Top: metadata (title, duration, participants). Middle-left: transcript with speaker labels + timestamps (mono). Middle-right: summary (LLM output). Bottom: audio waveform with playhead. Tabs: original notes · transcript · summary | → |
| B7 | Meetings list | `/meetings` | spec 0009 | Grouped by TODAY / YESTERDAY / THIS WEEK. Each row: title · duration (mono) · status chip | ✓ |
| B8 | Settings | `/settings` | spec 0010 | APPEARANCE (theme chips) · GLOBAL SHORTCUTS (rows with kbd) · VAULT (path + Obsidian picker per spec 0037) · ENGINES (transcriber/diarizer/LLM when present) | ✓ (basic) |
| B9 | Shared · view-only | `/shared/$token` | spec 0040 | Stripped shell: no sidebar, no tab bar. Just the note/canvas/meeting content with a "Shared by $owner" chip. Read-only UI state | ◊ (F3) |

## C. Modals & overlays

| # | Surface | Spec | Design note | Mock |
|---|---|---|---|---|
| C1 | Share modal | spec 0040 | Triggered from "Share" button in tab bar header of a note/canvas. Fields: permission (view/comment/edit), expires (never/7d/30d), copy link. Lists existing shares with revoke | → (F3) |
| C2 | Create workspace modal | spec 0041 + spec 0046 | Name (auto-slug preview in mono), description, icon grid (15 Lucide icons). Submit writes `.workspace.toml` + subdirs, switches to it | → |
| C3 | Rename workspace modal | spec 0041 | Inline-style small modal. Name editable, slug locked (per ADR-0017). Cancel / Save | ◊ |
| C4 | Delete confirm dialog | spec 0005 + spec 0044 | Soft-delete confirmation: "Move to Trash?" (not "Permanent delete"). Primary action moves to `.coxinha/trash/`, restore available | → |
| C5 | Trash view | new **spec 0044** | Full-screen (or large modal) list of deleted items: title, deleted-at (mono), original path. Filter by age (7d/30d/60d). Restore button per row; "Empty trash" at top with confirm | → |
| C6 | Templates picker | spec 0041 | Opens when user types `/template` in BlockNote OR on "New from template" in the sidebar `+` dropdown. Shows available templates from `.coxinha/types/*.yml`. Plain grid, no hero cards | → |
| C7 | Keyboard shortcuts sheet (`?`) | spec 0042 | Opens on `?` key when no field is focused. Lists all global + in-app shortcuts. Grouped. Escape closes | → |
| C8 | Rebuild index progress | spec 0005 | Small dialog / inline bar in Settings showing `Indexing 1247 of 3298 notes…` with a spinner-free indeterminate stripe. Honors reduced-motion | → |
| C9 | Onboarding — first-run | spec 0017 | Single screen when no `config.toml` exists: "Pick a vault folder" (empty default → home/coxinha, or "Adopt an Obsidian vault" with picker). No multi-step tour | → |

## D. Special / ambient surfaces

Things that float, live-update, or run in the background.

| # | Surface | Spec | Design note | Mock |
|---|---|---|---|---|
| D1 | System tray icon | ADR-0007 | Icon-only. Menu: Open / New note / Start recording / Settings / Quit | → (OS-rendered, but document layout) |
| D2 | Call-detected toast | spec 0007 | Lower-right corner. Icon + "Teams call detected — Record?" + primary button · dismiss. Non-blocking, auto-hides 12 s. Spring-in from below | → |
| D3 | Recording indicator | spec 0007 | Tray icon turns orange + a subtle pulse ring while recording. Hovering shows elapsed time | → (tray) |
| D4 | Voice dictation overlay | new **spec 0047** (extends spec 0038) | In the Quick Capture window: mic icon at the top-right of the tab bar. Click → panel slides down with live waveform + partial transcript. "Stop" commits the transcript into the editor at cursor | → |
| D5 | Slash menu (`/ in editor`) | BlockNote native | Dropdown of block types + utility commands. We do not redesign — we DOCUMENT which entries are enabled (heading, paragraph, list, todo, quote, code, image, **mermaid** (spec 0011), **excalidraw** (spec 0012), divider). Filter by typeahead | → |
| D6 | Link preview on hover | new spec (future) | Hover `[[wiki-link]]` → tooltip card with first 3 lines of the target note. Delayed 400 ms. Obsidian-style | ◊ |
| D7 | Semantic link suggestions | new spec 0049 (depends on spec 0030) | As user types, ghost text or underline on phrases that match existing notes. Tab to accept as `[[link]]`. Uses local embeddings | ◊ |
| D8 | Inline Excalidraw block | spec 0012 | Small thumbnail + "Open" affordance. Click opens fullscreen modal with Excalidraw canvas. Save closes, refreshes thumbnail | → |
| D9 | Standalone canvas route | spec 0012 + ADR-0017 | Same Excalidraw fullscreen canvas, but for `workspaces/$ws/canvases/$uuid.excalidraw.json` (first-class resource). Shown as a tab in the tab bar like a note | → |
| D10 | Pre-meeting briefing | spec 0035 | Ambient panel, appears 5 min before a calendar event: lists recent notes linked to attendees + last meeting with them. Non-modal, right-slide toast | ◊ (F4) |

## E. Key interaction moments

Specific UX events within the above surfaces. Not new screens —
new MICRO-designs of "what happens when X".

| # | Moment | Lives in | Trigger | Design note | Mock |
|---|---|---|---|---|---|
| E1 | Hit `Win+Y` from anywhere | D1 + B3 | Global hotkey | Tray wakes → Quick Capture window spawns at center of focused display, 900×600. Cursor blinks. 2 s budget (spec 0003) | ✓ (target state) |
| E2 | First keystroke in empty state | B2 / B3 | Any keypress after mount | Transient draft → 200 ms debounce → `create_note` → URL replaces to `/notes/$id` silently. No flicker. See spec 0042 | → (animated sequence) |
| E3 | Blur empty draft | B2 / B3 | Focus leaves editor with no content | Draft discarded. No IPC, no file, no DB row | ✓ (covered in empty-state-flow.svg) |
| E4 | `Ctrl+K` opens palette | A5 | Hotkey or sidebar search icon | Palette grows from 0 to full-scale (200 ms spring), backdrop scrim fades in. Typeahead focused | → |
| E5 | Switch workspace | A4 | Click brand / `Ctrl+1..9` | Popover opens 200 ms, select → workspace switches, sidebar re-populates with new note list, URL updates to `/w/:ws/...`, tab bar resets (empty draft). Spring-in on notes list | → |
| E6 | `/` opens block menu | D5 | Typing `/` in BlockNote | Inline dropdown under cursor. Arrow keys + Enter. Filters as you type | → (BlockNote native) |
| E7 | Quick Capture → Full shell | A8 | Click maximize icon or `Ctrl+Shift+M` | See A8 animation. Sidebar slides in from left at 150 ms, BacklinksPanel from right at 220 ms, window size spring-animated | → (sequence mock) |
| E8 | Start recording | D1 / D2 | Win+Shift+R or "Record" on call-detected toast | Tray icon turns orange. No modal. Meeting metadata file created. Recording runs in background. Click tray "Stop recording" OR Win+Shift+R again to stop | → |
| E9 | Stop recording → meeting detail | B6 | Stop recording | New meeting entry appears in `/meetings`. If called from "Open meeting" on tray, routes to `/meetings/$id`. During transcription: status shows "Transcribing… 34 %" (spec 0008) | → |
| E10 | Meeting summary generation | B6 | First successful transcribe + LLM configured | `/meetings/$id` summary tab animates from spinner → rendered summary. Cursor at top of summary for immediate edit. Granola-inspired: enhanced summary lives BESIDE original transcript, not replacing it | → |
| E11 | Save a note | B1 | `Ctrl+S` / idle 500 ms | Orange save dot appears in meta row, 600 ms fade. No toast. | ✓ (static) |
| E12 | Open Excalidraw block inline | D8 | Click thumbnail in editor | Fullscreen modal with Excalidraw canvas. `Esc` or Save closes; thumbnail refreshes | → |
| E13 | Create a tab | A3 | `Ctrl+T` / `+` in tab bar | New empty draft as the new active tab. No modal. Same flow as E1 but without window spawn | → |
| E14 | Close a tab with unsaved content | A3 | Click close-x or `Ctrl+W` | If transient draft (never persisted): closes silently. If persisted: closes, dropped-tab history on `Ctrl+Shift+T` reopens | → |
| E15 | Delete a note | C4 / C5 | Right-click note in sidebar → Delete | Confirm modal → move to `.coxinha/trash/`. Note disappears from sidebar, tabs close if open. Trash link in footer turns bold for 5 s | → |
| E16 | Restore a deleted note | C5 | Trash view → Restore row | Note reappears at original path, sidebar refetches. If path collision, suffix `-restored` | → |
| E17 | Add `[[wiki-link]]` | B1 | Type `[[` in editor | Autocomplete dropdown listing notes (fuzzy by title). Enter inserts link. Unknown target allowed (creates a "ghost link" styled in muted ink) | → |
| E18 | Preview a wiki-link | D6 | Hover over `[[link]]` | Tooltip card after 400 ms: title + first 3 lines. Click navigates; `Ctrl+Click` opens in new tab | ◊ |
| E19 | Tag a note | B1 + A2 | Type `#tag` anywhere in body | Tag is extracted (spec 0005). Pill appears in sidebar TAGS section within 150 ms. Inline pill style matches sidebar pill | → |
| E20 | Theme flip | B8 + everywhere | Click theme chip in Settings, or OS preference change | All surfaces cross-fade their colours in 200 ms. Token-driven — each surface does it automatically via CSS variables. No JS per-element animation | → |
| E21 | Edit a note property | B1 | Click the property row above the editor | Typed inputs per field (date picker for `created_at`, tag multi-select for `tags`, slug-validated text for `workspace`, etc.). Writes back to YAML frontmatter. Obsidian-inspired. Future spec | ◊ |
| E22 | Insert a block reference | B1 | Type `[[Note#^` in editor | Picker opens for target note's blocks (auto-generates `^abc123` ids on-the-fly). Enter inserts `[[Note#^id]]` as a link; `![[Note#^id]]` as a live embed | ◊ |
| E23 | Regenerate meeting summary | B6 | Click "Regenerate" in the summary tab | Editable prompt input, re-runs `summarize_meeting` with the new prompt. Original preserved in history. Granola-inspired | → |
| E24 | Pre-meeting prep popup | D10 | 5 min before a calendar event | Right-side toast: attendee names, prior meetings with them, recent mentions in vault. Non-modal, dismissible. Spec 0035 | ◊ (F4) |
| E25 | In-meeting scratch pad | B3 + D3 | User starts recording with Quick Capture open | The Quick Capture window becomes the meeting's scratch pad. Notes typed during the call are saved as part of the meeting note. Granola parallel. Auto-linked to the recording on stop | → |
| E26 | Create-on-enter from palette | A5 / E4 | `Ctrl+K`, type a title that doesn't match any note, `Enter` | Creates a new note with that title in the default folder of the active workspace, opens it in a new tab. Obsidian quick-switcher pattern. (spec 0043 open question) | → |

## Next mockup waves

Ordered for highest design-value-first, dependencies respected.

**Wave 2** (foundations, non-stateful):
- A4 workspace switcher popover
- A5 command palette overlay (Ctrl+K)
- C2 create workspace modal
- A8 / E7 focus/compact mode transition frames (before / during / after)

**Wave 3** (content detail):
- B6 meeting detail layout
- E9 meeting post-stop → route transition
- E10 summary generation state

**Wave 4** (modals):
- C1 share modal (once spec 0040 surface settles)
- C4 + C5 delete confirm + trash view
- C6 templates picker
- C7 keyboard shortcuts sheet
- C9 onboarding

**Wave 5** (ambient / special):
- D2 call-detected toast
- D4 voice dictation overlay
- D8 / D9 Excalidraw inline + standalone canvas
- E4, E5, E7 animation sequences (before / during / after)

**Deferred** (require an unwritten spec):
- B5 calendar strip (new spec 0048)
- D6 link hover preview (future spec)
- D7 semantic link suggestions (spec 0049, depends on 0030)
- D10 pre-meeting briefing (spec 0035)

## Competitive cross-reference

For every surface above, the nearest-competitor decision.
Full research in:

- `notion-flow-inventory.md` (1186 words)
- `obsidian-flow-inventory.md` (1354 words)
- `granola-flow-inventory.md` (1173 words)
- `type-model-benchmark.md` (AnyType / Obsidian / Notion / Mem / Granola)
- `shortcut-map.md`

### Baked-in calls

- **Command palette (A5)** — Obsidian keeps **two** surfaces:
  `Ctrl+P` runs *commands*; `Ctrl+O` is the *quick switcher*
  for notes (create-on-enter if no match). Coxinha collapses
  both into **one `Ctrl+K`** with typed sections. Simpler
  mental model, fewer hotkeys. Follow-up: add Obsidian's
  *create-on-enter* behaviour as a palette action when no
  page matches the typed query — see spec 0043 open question
  on "Enter behavior for unmatched queries".
- **Workspace (A4)** — AnyType-like Spaces, not Mem's
  Collections (tag-like). Our workspaces are filesystem
  folders per ADR-0017; AnyType keeps them in a proprietary
  DB; we win on "open the folder in any Markdown editor".
- **Page tree (A2)** — Obsidian shows the vault folder tree;
  Notion shows a page hierarchy distinct from filesystem.
  Coxinha follows Obsidian: filesystem is the tree. A note
  has sub-pages only if its folder has child `.md` files.
  (spec 0045)
- **Slash menu (D5)** — BlockNote ships an **insert-only**
  slash. Obsidian's core Slash Commands plugin wires `/` to
  **every registered command** (toggles, templates,
  settings). Coxinha should follow Obsidian: extend the
  BlockNote slash menu so `/record`, `/summarize`,
  `/template <name>`, `/open settings` are reachable from
  inside the editor — not only block insertions. Note for
  a future spec 0050 (or fold into 0043).
- **Quick Capture (B3)** — closest analog is macOS's
  "Quick Note" scribble. Obsidian has nothing equivalent;
  Notion's `Ctrl+Alt+N` requires Notion window open. We win
  on "tray-resident, zero-launch-cost".
- **Meeting detail (B6)** — Granola's signature is
  "enhanced notes beside transcript" — user's hand-written
  notes during the call become the left column; AI
  summary + action items become the right column; the raw
  transcript is a toggle. That is the layout to steal. Not
  Otter-style transcript-first.
- **Meeting in-flight typing (D2 + B6)** — Granola lets the
  user type notes **during** the meeting in the same window
  that surfaces the live transcript. The hand-written notes
  persist raw even after the AI enhance pass. Our equivalent:
  the Quick Capture window is already a blank editor —
  during recording, it can double as the in-meeting scratch
  pad, with the note automatically linked to the meeting
  recording afterwards.
- **Share (C1)** — Notion's per-person permissions inside a
  team workspace is the wrong fit. Link-first with
  token-based scoping (spec 0040) is closer to Excalidraw
  Cloud / CodeSandbox.
- **Canvas (D8 / D9)** — Excalidraw is our block format
  (spec 0012). Inline block: Obsidian+Excalidraw-plugin
  pattern (`.excalidraw.md` with YAML frontmatter + fenced
  JSON). Standalone canvas route: Excalidraw Cloud file
  pattern. Both coexist per ADR-0017. **Steal from
  Obsidian+Excalidraw**: `![[drawing.excalidraw|400]]`-style
  width hint on embedded drawings; per-file frontmatter for
  `excalidraw-export-dark` and `excalidraw-export-pngscale`
  as customization without leaving Markdown.

### Properties UI (missing from current inventory)

Obsidian 1.4+ renders YAML frontmatter as a **typed table
above the note body** — text, number, date, datetime,
checkbox, list, tag. Edits write back to YAML on disk.

Coxinha's notes already carry frontmatter (`id`, `tags`,
`meeting`, plus `workspace` and `type` after spec 0041).
Today we hide the YAML; Obsidian's approach surfaces it as
editable UI. **Adopt for F1.5 / F2:** new entry `B1.1
Properties editor` — a collapsible table between the title
and body of a note. Each property type gets a tailored
input (date picker, tag multi-select, etc.). Write-back
path goes through `storage::update_note` with the YAML
re-serialized.

Added as entry E21 below.

### Calendar & agenda (feeds spec 0048)

Obsidian's **Calendar plugin (liamcain)** is the closest
model for Coxinha's Agenda integration:

- Right-sidebar or pane-embedded month grid.
- Each day cell shows a **word-count meter** (density dot
  sized by how much was written).
- Click a day → opens its daily note; `Ctrl+Click` splits;
  `Ctrl+Hover` shows a Page Preview.
- Reads the Daily Notes + Periodic Notes settings — so the
  grid is consistent with the user's daily naming scheme.

For Coxinha we add OS calendar integration on top (Google /
Outlook events visible as chips on their day). Spec 0048
picks this up.

### Block references & transclusion (missing from current inventory)

Obsidian's `[[Note#^block-id]]` + `![[Note#^block-id]]`
pattern is high-leverage for meeting recaps: you can quote
a specific sentence from today's meeting summary inside a
project note, and it stays live.

Typing `[[Note#^` in the editor opens a block picker that
auto-generates a short `^abc123` id on the target block.
That id is invisible in rendered view, visible only in
source.

**Adopt at F2+:** add E22 below for `Insert block
reference`. Depends on the wiki-link picker (spec 0013)
already shipping.

### Granola-specific surfaces we steal

- **Pre-meeting prep view** (D10 in this inventory, spec
  0035) — mapped to a right-side toast/pane. Granola surfaces
  prior meetings with the same attendees, recent notes
  mentioning them, the calendar event's agenda field. We
  mirror this — local-first: the prep pulls from our vault +
  our own calendar cache.
- **Enhanced notes regeneration** — Granola lets the user
  regenerate the AI summary with a different prompt after
  the fact. Our equivalent: `Ctrl+Shift+R` (or a button in
  the summary tab) triggers `summarize_meeting` again with
  an editable prompt. Depends on spec 0008 wiring.
- **Meeting → note link** — after every meeting, Granola
  offers "Create note from this meeting". We do better: a
  meeting IS a note (`meetings/<uuid>/summary.md`) already
  per vault-schema, and our notes can `@mention` a meeting
  (spec 0013 + frontmatter `meeting:`). Document the
  equivalence.

### Non-features we explicitly don't copy

From the three docs combined:

- **Notion**: page icons / covers, cloud databases, team
  mentions, share-to-web publishing, inbox center.
- **Obsidian**: graph view as centerpiece, Dataview-as-query,
  plugin marketplace at launch, workspace-panes-pull-out-
  into-tabs complexity.
- **Granola**: cloud-required everything — recording lives
  in their infrastructure, summary generation runs in their
  cloud, sharing goes through their server.

For each, the rejection reason traces back to a ADR or a
product invariant (ADR-0002 local-first, ADR-0007
tray-resident, ADR-0015 knowledge/memory separation).

## How to read this doc

Every time a new spec lands or a mockup is produced:

1. Add or flip the **Mock** column for the affected row
2. If a surface is decomposed into sub-surfaces, split the
   row into two
3. New surfaces (from new specs) go in the right category
   alphabetically by spec number
4. When a competitor research doc lands, pull new
   comparative notes into the "Competitive cross-reference"
   section
