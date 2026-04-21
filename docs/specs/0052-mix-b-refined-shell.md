# Spec 0052 — Mix B Refined shell (ChromeBar + StatusBar + always-visible AI rail)

Status: implemented (2026-04-21)
Depends on: 0039 (URL routing), 0043 (command palette), 0051 (AI panel)

## Motivation

The 2026-04-20 pass landed a 44 px icon rail + collapsible AI panel
shell based on the first Claude Design handoff (warm paper + sage).
On 2026-04-21 the user refined the design in Claude Design a second
time ("Mix B Refined" — `docs/ui/new-options.pen`) and asked for it
to be adapted into the app.

The new variant keeps the one-rail-plus-editor topology but:

- Makes the route identity always visible via a **ChromeBar**
  (breadcrumb + Saved indicator) above every route.
- Adds a **StatusBar** footer under editing routes (word count /
  save state).
- Widens the icon rail from 44 → 48 px and tightens its active
  state (soft tangerine tint instead of a filled pill).
- Turns the AI panel into an **always-visible** 48 px `ASK` rail
  that expands to a 320 px panel on click or `⌘J`.
- Pivots the palette from warm paper + sage to neutral zinc +
  warm tangerine (`#DE8C3A` ≈ `oklch(0.700 0.140 55)`).
- Switches typography from Newsreader + Inter Tight to **Geist**
  (with Inter Tight as fallback).

Source: `docs/research/ui-audit/DESIGN.md` (reconciled at the top).

## User-visible contract

1. Every top-level route renders a 52 px chrome row at the top
   showing a breadcrumb trail (`notes / untitled.md`), and an
   optional right-side slot for a Saved indicator (orange dot +
   text) and a zoom-in icon.
2. Editing routes render a 36 px footer with word count / save
   state on the left.
3. The right side of the shell is always occupied by a 48 px AI
   rail containing a sparkles icon and a vertical `ASK` label.
   Clicking it (or hitting `⌘J` / `Ctrl+J`) expands the rail into
   a 320 px panel with Link / Related sections and an Ask input.
4. The icon rail stays at 48 px wide, with 32 px square buttons
   and 16 px icons. Active buttons get a soft tangerine tint.

## Implementation

- `src/components/ChromeBar.tsx` + `SavedIndicator` — new.
- `src/components/StatusBar.tsx` — new.
- `src/components/RouteLayout.tsx` — wraps each route in chrome +
  content + optional footer.
- `src/components/IconRail.tsx` — widened to 48 px, icons down to
  16 px, active state uses an inline `background-color` set from
  the OKLCH accent at 8 % alpha.
- `src/features/shell/AiPanel.tsx` — two states (collapsed 48 px,
  expanded 320 px) driven by the same `open` flag as before; the
  collapsed form renders a sparkles icon + vertical `ASK` label.
- `src/index.css` — token pivot (neutral canvas, tangerine
  accent), font swap to Geist, new utility classes `cx-crumb`,
  `cx-tag-chip`, `cx-status`.
- `index.html` — adds Geist via `<link>` preload.
- Each of `AgendaRoute`, `MeetingsRoute`, `SettingsRoute`,
  `NotesIndexRoute`, `NoteDetailRoute` wraps its content in
  `<RouteLayout>`.
- `NoteEditor` renders a 38 px Geist 700 title + meta row + tag
  chips above the BlockNote column, with the reading column
  centered at 760 px.

## Acceptance

- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes (55 tests — includes new NoteHeader +
  ChromeBar component tests that lock the chrome contract
  without needing Tauri IPC).
- [x] Playwright evidence captured in
  `docs/research/ui-audit/evidence/2026-04-21-mix-b-refined/`
  for notes index (light + dark), settings (light + dark),
  meetings (light + dark), AI panel expanded (light + dark),
  and command palette.
- [x] `NoteHeader` + `ChromeBar` component tests cover the
  Mix B Refined chrome contract: title fallback, meta date
  formatting, tag chip rendering, breadcrumb active marker.
  Tauri-mode visual spot-check still welcome before merging,
  but the contract is captured in tests.

## Out of scope

- Rebinding the dedicated sidebar notes list. The mockups don't
  have one — discovery is via the command palette only.
- Word-count computation in `NotesIndexRoute` (stub `0 palavras`
  for now; real counting lands when the BlockNote document is
  reachable from here).
- Meeting-alert toast and recording workspace variants (Pages 5
  and 6 in the mockup). Separate surface, separate spec.
