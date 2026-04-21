# Spec 0055 — Note detail with lineage tab + right icon column

Status: draft (2026-04-21)
Depends on: 0052 (Mix B Refined shell), 0049 (semantic links),
a future "fato unitário" lineage spec
Relates to: Page 20 of the Mix B Refined mockup
(`docs/ui/new-options.pen`, frame `TnJiW`)

## Motivation

Page 20 evolves the note detail screen into a workspace where
every block carries its **lineage** — the meetings, notes, and
captures that a given decision or section came from. The user
called out this frame as "muito clean" and worth aligning the
app around.

The reference layout has three core moves that the current shell
(spec 0052) doesn't yet support:

1. **Tabs on top** of the note: Note / Meeting, with a toggle
   for "image side tab aberto" — different facets of the same
   underlying resource surface as tabs rather than separate routes.
2. **Right icon column** (~32 px) with six icons stacked
   vertically (lineage, links, image, tags, memory, activity).
   Each icon toggles a **wider panel** (~360 px) just inside the
   column, which replaces today's binary open/closed AI panel.
3. **Lineage panel content**: a vertical timeline of "fatos"
   (facts/events) — prior meetings, transcript snippets, chunk
   markers, conclusions — all linked back to the current block
   that quotes them.

## User-visible contract

1. The note detail route shows **two tabs** above the chrome:
   `Note` and `Meeting` (or the relevant facets for the current
   resource type). The active tab is indicated by a tangerine
   underline; switching is instant, no URL change.
2. The right edge hosts a **permanent 32 px icon column**. Icons
   in order (top to bottom):
   - Lineage (clock/history)
   - Links (chain)
   - Image (picture)
   - Tags (hash)
   - Memory (sparkles)
   - Activity (pulse)
   The currently open panel's icon gets the accent tint.
3. Clicking an icon toggles a **360 px panel** between the icon
   column and the main content. Only one panel is open at a time;
   clicking the same icon again closes it.
4. Lineage panel rows render a timeline entry each — source
   (meeting / note), speaker, timestamp, a snippet of the
   content, and a small affordance to jump to the source.
5. The `ChromeBar` from spec 0052 stays mounted with its
   breadcrumb + Saved indicator; the tabs render above or
   beside it (TBD during implementation).

## Implementation hints

- The 320 px "ASK" panel from spec 0052 becomes the first of
  several panels (Lineage, Links, ...). Rename
  `AiPanel.tsx` → `SidePanel.tsx` with a discriminated
  `{ mode: 'links' | 'lineage' | ... }` prop.
- The collapsed 48 px `ASK` rail from spec 0052 becomes the
  32 px icon column — shrink width, stack icons vertically,
  drop the vertical `ASK` label.
- Note content blocks grow a `data-fact-id` attribute so
  clicking a block can scroll the lineage panel to the
  matching row (and vice versa). This hooks into spec 0049's
  semantic-link graph as the source of facts.
- Tab switching is state-local to the route. No new routes.

## Out of scope

- The lineage graph backend — a separate "fato unitário" spec
  owns the data model for facts and provenance.
- Multi-pane side-by-side layouts (e.g., two panels open).
- Tab bar for multiple open notes (covered by a future
  "workspace tabs" spec).

## Acceptance

- [ ] Note detail route shows the Note / Meeting tab bar and
  the 32 px icon column matches Page 20 tokens.
- [ ] Clicking each icon opens its panel in the 360 px slot;
  a second click closes; opening a different icon swaps.
- [ ] Lineage panel renders a synthetic fixture with at least
  5 rows in dev — real data arrives with the lineage backend
  spec.
- [ ] Test: toggling between panels preserves the scroll
  position of each panel independently.
- [ ] Storybook / Playwright evidence comparing the implemented
  view with Page 20 of the mockup.
