# Spec 0051: AI Assistant panel

- **Status:** implemented (visual stub only — data wiring pending)
- **Phase:** F2 (stub) · F4 (data when spec 0030 embeddings land)
- **Owner:** Rodolfo
- **Depends on:** spec 0049 (semantic link suggestions), spec
  0030 (local embeddings), spec 0043 (command registry reuse)
- **Relevant ADRs:** ADR-0015 (Memory layer — suggestions here
  are Memory, always labelled, always dismissible)
- **Layer:** Memory → Outputs (AI-derived context surfaced
  beside the editor; never authoritative)

## Why

The Claude Design handoff layout positions an always-visible
right panel — "Assistant" — next to the editor. Its job is
ambient context: **what other notes relate to what I'm writing
right now**, plus a low-ceremony "Ask…" input for future
AI-chat features. Granola ships an analogous post-meeting
"enhanced notes" column; we bring that ambient context in as
a first-class panel for any note, not only meetings.

The panel is a visual home for what will eventually be spec
0049's semantic link suggestions (link candidates) and spec
0035's pre-meeting briefing (related recent meetings). Today
it's a stub that renders the shell and empty states; the data
follows later.

## Scope

### In

- **Component:** `src/features/shell/AiPanel.tsx`, mounted at
  the route root beside the editor `<Outlet />`.
- **Width:** 300 px fixed. Border-left `hairline`. Sunken
  surface fill (`--bg-sunken`) so it recedes against the
  canvas without a shadow.
- **Sections:**
  1. **Header** — `ASSISTANT` eyebrow label + sage live-dot +
     `⌘J` close chip at the right.
  2. **Link suggestions** (Memory — spec 0049): list of
     `[[Target Title]]` candidates with a one-line note
     (reason: "3 connections · same project", "explicit
     reference · spec", etc.). Empty state: "No suggestions
     yet." italicised.
  3. **Related** (Memory — future): related notes with title
     + snippet. Empty state same.
  4. **Ask input** at the bottom with Sparkles icon (sage)
     and a `⌘J` kbd chip. Placeholder "Ask…". For F2 the
     input is not wired.
- **Toggle:** `Ctrl+J` / `Cmd+J` toggles open/closed. Default
  open on `/notes/$id` routes, closed elsewhere.
- **State persistence:** per-workspace `panel_open` boolean in
  `.workspace.toml` (Phase F2 add). Until then, session only.
- **Dark mode:** inherits theme tokens.
- **A11y:** the panel is `<aside aria-label="Assistant">`,
  each section an eyebrow heading + list; the Ask input is a
  focusable textbox even when the data pipeline is stubbed.

### Out

- **Actual AI chat** — no generation backend in F2. The Ask
  input captures text but doesn't dispatch; wired up in a
  future spec.
- **Scrolling conversation history** — same reason; punt.
- **Multiple panels** (e.g., Outline, Properties, Backlinks
  tabs within the panel) — considered, rejected for F2. The
  panel is single-purpose. Backlinks stay on `BacklinksPanel`
  (different component, different route).
- **Regenerate / thumbs-up-down controls** — part of the
  eventual AI-chat spec.
- **Per-note open/closed state** — global per-workspace only
  for F2.

## Behavior (acceptance)

1. **Mounts without data.** Opening any route renders the
   panel (when open) with the "No suggestions yet." state.
   Vitest snapshot.
2. **Ctrl+J toggles.** Open state persists across route
   transitions. Integration test on `__root.tsx`.
3. **Default open on `/notes/$id`, closed elsewhere.** Verify
   by mounting with different pathname fixtures.
4. **Close button flips state.** Clicking the ⌘J chip closes.
5. **A11y landmarks.** `aside` with `aria-label`, each section
   has an `aria-labelledby` reference.
6. **Budget.** Mount cost ≤ 20 ms on a 5 k-note fixture —
   irrelevant today (no data), pins the ceiling for when
   spec 0049 lands.

## Design notes

- **Empty-state discipline:** "No suggestions yet." is
  italicised per Claude Design handoff. Prefer italic sans
  over a larger illustration — keeps the panel quiet while
  data is genuinely missing.
- **Ask input** is sage icon + plain input + kbd chip. Don't
  style it as a "prompt bar" with gradient or glow — that
  reads as a browser AI bar, not a notebook affordance.
- **Live-dot** uses the sage accent with a soft `--accent-soft`
  glow (`box-shadow: 0 0 0 3px`). Signals "listening" without
  animation — per DESIGN.md §6 reduced-motion friendly.
- **No drag-to-resize** in F2. Width is fixed; if users ask,
  add a drag handle in a future spec.

## Open questions

- **Where do link suggestions come from for a BRAND NEW note
  with no text?** Probably show "Start writing to see
  suggestions" until the note has a paragraph. Part of spec
  0049 integration.
- **Should Ask prompts** be dispatched to a local LLM only
  (per ADR-0002 zero-network) or allow cloud-opt-in? Deferred
  to the AI-chat spec.
- **Should Ctrl+J close the palette if the palette is open?**
  Currently toggling one doesn't touch the other — feels
  right. Confirm via usability.

## Test plan summary

- **Vitest**: render open/closed states, toggle via Ctrl+J,
  close button, default-open logic per route.
- **A11y snapshot:** `aside` landmark + eyebrow labels.
- **Integration** (next): spec 0049 supplies link suggestions;
  panel renders them.
