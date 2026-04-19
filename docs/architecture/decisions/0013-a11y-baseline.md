# ADR-0013: Accessibility baseline (WCAG 2.1 AA)

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Coxinha is a productivity tool used daily. Keyboard-first users,
screen-reader users, and people with motor or vision constraints
must be first-class. Accessibility can't be a post-F1 afterthought;
patterns decided now shape every component.

## Decision
Target **WCAG 2.1 Level AA** across the app. The non-negotiable
baseline:

1. **Semantic HTML first.** Use `<button>`, `<nav>`, `<main>`,
   `<aside>`, `<header>`, `<footer>` — not `<div>` with onClick.
2. **Every icon-only control has an `aria-label`** (or a visible
   text label).
3. **Keyboard reachability.** Every interactive element works with
   Tab + Enter/Space. No mouse-only paths.
4. **Focus must be visible.** Never remove the focus ring without
   replacing it with an equivalent visual.
5. **Color contrast ≥ 4.5:1** for text, ≥ 3:1 for UI components.
6. **Motion is optional.** Respect `prefers-reduced-motion`.
7. **Dialogs trap focus** while open and return focus on close.
8. **Form fields have associated labels**; errors are announced to
   screen readers.

## Consequences
- **+** The app is usable by more people from day one
- **+** Better keyboard flow helps everyone, not just a11y users
- **+** Catches design problems early (icon-only buttons without
  labels are ambiguous for everyone)
- **−** Slightly more code per component (aria-* attributes,
  keyboard handlers when semantic HTML isn't enough)
- **−** Requires discipline during code review
