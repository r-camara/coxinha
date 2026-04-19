# Spec 0034: Accessibility baseline

- **Status:** in-progress
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0013

## Why
Accessibility has to be part of F1; retrofitting it later is
painful and expensive. Keyboard and screen-reader users must be
able to do everything a mouse user can.

## Scope

### In
- Semantic HTML in every component (`<button>`, `<nav>`, `<main>`,
  `<aside>`, `<header>`, `<footer>`)
- `aria-label` on every icon-only button / control without visible
  text
- `role` and `aria-*` when HTML semantics don't cover the pattern
  (custom comboboxes, menus, dialogs)
- Focus ring visible and never removed without replacement
- Keyboard navigation: Tab order sane; Enter/Space activate buttons
- Focus trap + return focus on dialog/modal open/close
- Respect `prefers-reduced-motion`
- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components (enforced in
  design tokens under `src/index.css`)

### Out
- Full screen-reader QA with NVDA/JAWS/VoiceOver → continuous work,
  not a gated ship criterion for F1
- Accessibility of future complex widgets (knowledge graph, chat
  UI) — their own specs

## Behavior (acceptance)
- **Tab through the app:** every interactive element is reachable
  in a sensible order
- **No mouse:** user can create a note, edit, save (via autosave),
  navigate views, and open settings entirely from the keyboard
- **Screen reader on the sidebar:** reads "Navigation", "Notes,
  button, selected", "Agenda, button", etc.
- **Icon-only button in Sidebar ("+ New"):** announced as "New
  note, button" (aria-label)
- **Focus visible** on every focused element (2px outline or
  equivalent)
- **Reduced motion:** any transition > 300ms is disabled when
  `prefers-reduced-motion: reduce`

## Design notes
- Tailwind utilities handle most of the styling; `focus-visible:`
  variant is the knob for focus ring
- shadcn components ship with a11y baked in — use them as-is when
  possible, don't override defaults
- Check list per PR: "any icon-only button? any new dialog? any
  custom combobox/menu?"
- Brand name "Coxinha" is a visible `<h1>` — no aria-label required

## Open questions
- Axe-core or Playwright a11y assertions in CI → F1.5 once the app
  has pages worth auditing
- High-contrast Windows theme support: Tauri respects OS theme;
  verify when WebView2 exposes `forced-colors`
