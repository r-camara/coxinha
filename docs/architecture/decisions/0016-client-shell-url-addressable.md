# ADR-0016: Client shell — URL-addressable state + feature-oriented layout

- **Date:** 2026-04-20
- **Status:** Proposed

## Context

The client-side shell has grown faster than its structure:

- `App.tsx` is a pseudo-router: a `useState<View>` enum plus a chain
  of conditional renders. Every new screen (agenda, meetings,
  settings) widened the conditional and pushed cross-cutting
  concerns (theme, events, focus) into a single effect block.
- `src/components/` is flat. `NoteEditor`, `BacklinksPanel`,
  `AgendaView`, `SettingsView`, `Sidebar` sit side by side even
  though some belong to a single feature and others are truly
  shared.
- `NoteEditor` hand-rolled a Suspense cache with a module-scoped
  `Map<string, Promise<NoteContent>>` to survive React 19's stable-
  promise requirement. It is a workaround for the absence of a
  route-level loader.
- The global-shortcut bridge (`events.navigate` → `setView`) is a
  second ad-hoc router.

At the same time, the product plan **already** relies on URL-style
addressing without making it a first-class concept in the code:

- Spec 0022 (web read-mostly UI) serves the same vault over HTTP
  and will want stable paths like `/notes/$id`.
- ADR-0002 + specs 0019–0021 position a future Axum backend that
  speaks the same object graph; a route-shaped client lines up
  directly with it.
- Team sharing (not yet specced) will want a link you can paste —
  i.e., a URL.

Today the client has none of this. The `active note` concept lives
in Zustand; there is no way to deep-link into a note, reload the
app on a specific screen, or address anything via a shareable
string. A future change will have to retrofit URLs into every
screen — a much bigger refactor than introducing them now, while
the surface area is still five views.

Keeping things as-is is not cheap either. Each new feature either
widens the `view` enum or adds another `useState` branch in
`App.tsx`, and each feature folder continues to accumulate files
in the flat `components/` pile. The shell is the kind of module
CLAUDE.md flags for the stop-and-refactor rule — it is not at 400
lines yet, but it is the wrong shape.

## Decision

Adopt two parallel principles for the client shell.

### Principle 1 — URL is the address of every addressable view

Any screen, note, meeting, or settings panel the user can reach is
identified by a URL. Navigation changes URLs; URLs do not mirror
state that lives elsewhere. Concretely:

- Use `@tanstack/react-router` with an explicit memory history in
  the Tauri build. The URL is internal (no address bar) but it is
  the source of truth for "what the app is showing." Hash history
  is reserved for a later switch if/when we need copyable deep-
  links in the web build (spec 0022 / future sharing spec).
- `activeNoteId` in Zustand goes away; the route param `/notes/$id`
  replaces it. The store keeps **data** (notes list, search
  results) and stops keeping **navigation state**.
- `events.navigate` (global shortcuts, tray menu, future agent
  hooks) funnels into `router.navigate(...)`. There is one router,
  one handler.
- Route loaders + `@tanstack/react-query` replace ad-hoc Suspense
  caches. `NoteEditor`'s module-scoped `Map` is removed; the route
  preloads via `queryClient.ensureQueryData` and the component
  reads from the cache.

This principle is what makes spec 0022 cheap: the web build
reuses the same route tree, swaps the history (browser), and only
has to disable the write-heavy routes.

### Principle 2 — Feature-oriented folders at the client root

Group by domain, not by technical kind. The client layout becomes:

```
src/
├── routes/              # route definitions only (thin)
│   ├── __root.tsx       # shell: Sidebar + Outlet + theme effect
│   ├── index.tsx        # redirect to /notes or render empty state
│   ├── notes/
│   │   ├── index.tsx    # no selection (empty state + "new note")
│   │   └── $noteId.tsx  # NoteEditor host + loader
│   ├── agenda.tsx
│   ├── meetings.tsx
│   └── settings.tsx
├── features/
│   ├── notes/           # NoteEditor, BacklinksPanel, hooks, queries
│   ├── agenda/
│   ├── meetings/
│   └── settings/
├── components/          # truly shared UI (Sidebar, EmptyState, LoadingSkeleton)
├── lib/                 # infra (bindings, perf, theme, i18n, store)
└── main.tsx
```

A route file is the *thinnest possible* thing: it imports a feature
component, declares a loader if needed, and hands off. The feature
folder owns its React surface, its React Query keys, and any
local state. `components/` is reserved for primitives used by
two or more features.

This is the pattern CLAUDE.md's "build-build-build-STOP-refactor"
rule is designed to trigger. Doing it at five views is cheap; at
fifteen it would be a week.

## Consequences

- **+** Spec 0022 (web read-mostly UI) becomes an API/server-mode
  swap on top of the same route tree. Zero per-screen migration.
- **+** Future team-sharing (unspecced) has a natural surface:
  the shared resource is just a URL — same string local and
  remote — which keeps the sharing model consistent with the
  address model.
- **+** Route loaders clean up two workarounds at once: the manual
  `noteCache` in `NoteEditor` and the `useState<View>` router in
  `App.tsx`.
- **+** Deep-linking from the global shortcut / tray / notifications
  becomes `router.navigate(...)` — no coupling to `App.tsx`
  internals.
- **−** Two new runtime deps: `@tanstack/react-router` and
  `@tanstack/react-query`. Bundle cost is ~45 KB gzipped
  together; measured as part of spec 0039 rollout.
- **−** One-time refactor of `App.tsx`, `NoteEditor.tsx`, and the
  flat `components/` folder. Scoped in spec 0039 and test-covered
  by the existing boot + perf budgets.
- **−** The convention adds a rule every new feature has to follow
  (route file + feature folder). `docs/architecture/conventions.md`
  has to encode it.

## Follow-up

- **Spec 0039** (new) — concrete router + layout refactor, F1
  housekeeping, test-covered by perf + boot budgets.
- `docs/architecture/conventions.md` — add a short section
  "Feature layout" and a line about URL-first navigation.
- `docs/architecture/overview.md` — replace the `NoteEditor`
  path inside the diagram caption with `features/notes/` and add
  a mention of `routes/` alongside `lib/`.
- **Spec 0022** — add a dependency on ADR-0016 and a note that
  its route tree is the desktop's, not a separate frontend.
- **Future spec (unnumbered)** — team-shared links. ADR-0016
  unblocks it by making "the thing to share" a URL; the spec
  will decide permissions, revocation, and storage — that is its
  own design discussion, not this ADR's.

## Non-goals

- This ADR does not revisit ADR-0002 or the filesystem-canonical
  invariant. The vault is still the source of truth; URLs address
  views over it, not an alternate storage.
- This ADR does not pick a specific router mode for the web build
  (hash vs browser). Spec 0022 decides that at implementation time.
- This ADR does not mandate file-based route generation. Spec 0039
  picks code-based or file-based as an implementation detail.
