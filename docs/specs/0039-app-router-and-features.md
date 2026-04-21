# Spec 0039: App router + features layout refactor

- **Status:** accepted
- **Phase:** F1 (housekeeping before F2 sync work)
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0016
- **Layer:** Outputs (shell only; no change to Knowledge/Memory)

## Why

`App.tsx` is a pseudo-router built from `useState<View>` and a
chain of conditional renders; `activeNoteId` lives in Zustand
instead of a URL; `NoteEditor` carries a hand-rolled Suspense
cache to survive React 19's stable-promise rule. None of this is
broken today, but every new screen widens it. Spec 0022 (web
read-mostly UI) will need URL parity with the desktop — cheaper
to introduce now than retrofit across fifteen screens.

## Scope

### In

- Add runtime deps: `@tanstack/react-router`, `@tanstack/react-query`.
- Replace `useState<View>` in `App.tsx` with a `<RouterProvider>`
  root. Memory history in F1 (Tauri has no address bar).
- Define routes: `/`, `/notes`, `/notes/$noteId`, `/agenda`,
  `/meetings`, `/settings`. `/` redirects to `/notes`.
- Move feature code to `src/features/{notes,agenda,meetings,settings}/`.
  Keep `src/components/` for shared primitives (`Sidebar`,
  `EmptyState`, `LoadingSkeleton`).
- Route loader for `/notes/$noteId` uses
  `queryClient.ensureQueryData` to fetch `get_note`; remove the
  module-scoped `Map<string, Promise<NoteContent>>` in
  `NoteEditor`. Suspense boundary stays at the route, not the
  component.
- Bridge `events.navigate` → `router.navigate({ to, params })`
  in a single effect at the router root. `useAppStore.newNote`
  stays where it is, but callers go through the router.
- Perf marks (`hotkey`, `create-invoked`, `note-created`,
  `editor-suspended`, `editor-ready`) remain wired; the rename
  pipeline does not change the measurement surface.
- Update `docs/architecture/conventions.md` with a "Feature
  layout" section and a one-line rule: *"New screens are routes;
  new domain code lives in `features/<domain>/`."*
- Update `docs/architecture/overview.md` ASCII diagram to name
  `routes/` and `features/`.

### Out

- File-based route generation. Start code-based (explicit
  `createRoute(...)`); reconsider when the tree exceeds ~12
  routes.
- Web-build history (hash or browser). Belongs to spec 0022.
- Team-sharing URL schema. Future unnumbered spec.
- Zustand teardown. Store still owns `notes` list and save/delete
  actions; only `activeNoteId` leaves (moves to route params).
- Server-side data fetching / SSR. Tauri is a SPA; Start's server
  layer is out of scope for F1.

## Behavior (acceptance)

Every item below must be covered by a test already present or
added in this spec.

1. **Boot to a route.** Cold launch opens `/notes` (redirect from
   `/`). A Vitest smoke in `App.test.tsx` asserts the sidebar
   renders and the empty state is visible when no note is
   selected.
2. **New-note flow preserves budget.** `Ctrl+Alt+N` navigates to
   `/notes/$newId` with the cursor in the editor within the 2 s
   UX budget (spec 0003). The existing `perf_new_note.rs`
   integration test and the frontend DevTools trace both continue
   to fire; a Vitest asserts `mark('hotkey')` is emitted from the
   route handler, not `App.tsx`.
3. **Deep-navigation works.** A programmatic
   `router.navigate({ to: '/notes/$noteId', params: { noteId }})`
   renders the editor without a page reload; navigating away
   flushes the pending debounce (existing `flushNow` contract
   preserved).
4. **Reload lands where it left.** Reload on `/notes/abc` stays
   on `/notes/abc` (memory history persists within the Tauri
   window lifetime; full restart falls back to `/notes` — this
   is documented, not asserted).
5. **Suspense at the route, not the component.** `NoteEditor`
   no longer imports `use(promise)`; the route loader supplies
   resolved data. Test: rendering the route with a pre-populated
   `QueryClient` shows the editor synchronously.
6. **`events.beforeQuit` still flushes.** Graceful shutdown test
   asserts a pending debounced save on a route-loaded editor
   flushes before `exit(0)` fires.
7. **No regression in boot budget.** `boot_smoke.rs` 2 s budget
   continues to pass with router + query in the bundle.

## Design notes

- **History type.** `createMemoryHistory({ initialEntries: ['/'] })`
  in F1. The Tauri window has no address bar, so hash/browser
  history would only add URL-bar noise in dev tools. Spec 0022
  revisits.
- **Query cache as loader cache.** `queryClient.ensureQueryData`
  with a stable key `['note', noteId]` is the replacement for the
  module-scoped `Map`. Invalidate on save (`queryClient.setQueryData`
  inside `useAppStore.saveNote`, which already returns the updated
  `Note`).
- **Events bridge.** The navigate handler moves from `App.tsx` to
  a `useNavigateEvents(router)` hook under `features/shell/`. The
  `Route` enum from `src-tauri/src/events.rs` maps exhaustively to
  router paths; the mapping lives beside the hook, not in
  `bindings.ts`.
- **Perf mark placement.** `mark('hotkey')` moves out of
  `App.tsx` and into the same navigate-events hook. Placement
  stays *before* `router.navigate(...)` so the measurement window
  still captures the full hotkey-to-editor path. The rest of the
  marks stay where they are (`store.ts`, `NoteEditor.tsx`).
- **`src/components/` pruning.** Move `NoteEditor.tsx`,
  `BacklinksPanel.tsx`, `AgendaView.tsx`, `SettingsView.tsx` into
  their feature folders. Keep `Sidebar.tsx` in `components/`
  (used by the root layout). Test files move with the components.
- **No Zustand -> Router state rewrite.** The store keeps data
  (`notes`, `saveNote`, `deleteNote`, `searchNotes`,
  `openDailyNote`). It just stops tracking `activeNoteId`.
  Components read the note id from `useParams()` instead of the
  store.
- **Lucide import paths** stay unchanged — this spec does not
  touch the icon layer.

## Open questions

- Do `/agenda` and `/meetings` live at root, or under a `/calendar`
  prefix? Kept flat in this spec; revisit when a third calendar-
  shaped view shows up.
- Does `/notes` keep the sidebar search + list, or do we nest
  search under `/notes/search`? Kept inside `/notes` index route
  for F1; web UI (spec 0022) can decide otherwise.
- Do we co-locate route-level tests with routes or under
  `test/routes/`? Proposal: alongside the route file, same as
  component tests. Confirm at implementation time.
- Should the `events.beforeQuit` listener live at `__root` or in
  the notes feature? The pending debounce it flushes is a
  note-editor concern, so probably the notes route — open for
  review.

## Test plan summary

- Unit: route resolver, navigate-events hook, loader cache.
- Integration: `App.test.tsx` cold boot, route-level editor
  render, shortcut → navigate path.
- Perf: existing `perf_new_note.rs` (backend, unchanged) + new
  Vitest that asserts the hotkey→navigate→editor-ready sequence
  still emits all five marks.
- Budget: `boot_smoke.rs` 2 s unchanged.
