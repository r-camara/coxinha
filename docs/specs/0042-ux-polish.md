# Spec 0042: UX polish — shortcut, empty state, UI primitives

- **Status:** draft
- **Phase:** F1 (incremental housekeeping; can land before or
  after spec 0041 but most naturally alongside spec 0039)
- **Owner:** Rodolfo
- **Depends on:** spec 0039 (router lands before the empty-state
  redesign can rely on `/` routing to a transient draft)
- **Relevant ADRs:** ADR-0013 (a11y baseline), ADR-0016 (client
  shell)
- **Layer:** Outputs (UX chrome over existing Knowledge; no
  storage or Memory changes)

## Why

The UI audit (`docs/research/ui-audit.md`) pulls three concrete
items from the project owner's review:

1. `Ctrl+Alt+N` is intercepted on Windows by OneNote / Office
   365. The primary entry point of the app is broken for the
   target user.
2. The empty state is a centered "New note" button — it reads as
   a gated form. The product wants "press key, start typing."
3. There is no UI primitives layer (`Dialog`, `Popover`,
   `DropdownMenu`, `Toast`, `Command`). Every upcoming feature —
   workspace switcher (spec 0041), share modal (spec 0040), tag
   dropdown, save-error toast — is blocked on inventing one.

This spec addresses all three with the smallest surgery that
preserves ADR-0002 (local-first) and the current perf budgets
(spec 0003).

## Scope

### In

**Global shortcut change.**

Revised after field testing (see `docs/research/shortcut-map.md`):

- Defaults move to `Super+Shift+<letter>` (Win+Shift+*), using
  the Windows key. Rationale: `Win+Shift+<letter>` does not
  appear in Microsoft's Win11 shortcuts list for any of the
  letters we use; the pre-0042 `Ctrl+Alt+*` was intercepted in
  the field (OneNote) and the transitional `Ctrl+Alt+Shift+*`
  also failed — likely because users had stale `config.toml`
  values and the `Default` impl doesn't apply on upgrades.
  - `new_note`: `Super+Shift+N`
  - `open_app`: `Super+Shift+C`
  - `agenda`: `Super+Shift+A`
  - `meetings`: `Super+Shift+M` (collides with Windows' "restore
    minimized windows" — acknowledged, letter may change if it
    surfaces in use)
  - `toggle_recording`: `Super+Shift+R` (collides with
    Windows 11's "record screen region" — same trade-off)
- **Config migration.** `config.rs::migrate_stale_shortcut_defaults`
  rewrites any `config.toml` whose shortcuts exactly match
  either pre-0042 default set (`Ctrl+Alt+*` or `Ctrl+Alt+Shift+*`)
  to the current defaults. Users who customized even one key
  are left untouched. One-shot, persisted back to disk, logged.
- Update `docs/architecture/overview.md` (shortcuts table),
  `docs/specs/0003-cold-start-load.md`, and
  `docs/research/shortcut-map.md`.

**Empty-state redesign.**

- Route `/` (per ADR-0016 + spec 0039) renders the editor
  directly on a **transient draft** — an in-memory `NoteContent`
  with an ephemeral id, no DB row, no file on disk.
- First keystroke triggers `create_note` with the buffered
  content; the route replaces to `/notes/<id>` silently (no
  `router.navigate` animation or remount), state preserved.
- Blur on empty discards the draft — no `create_note` call
  happens. No file, no row, no visible history.
- Full-bleed: editor consumes the main pane without an inner
  container, padding, or border. Matches a plain Markdown file
  opened in a clean editor.
- Subtle placeholder text at reduced opacity, i18n-ready.
- The sidebar "+" button and the new-note shortcut continue to
  call `create_note` immediately (explicit intent).

**Design-system primitives (shadcn cherry-pick).**

- Add `@radix-ui/react-*` as runtime deps and shadcn CLI as a
  dev dep.
- Cherry-pick, via `pnpm dlx shadcn@latest add ...`:
  - `dialog`
  - `dropdown-menu`
  - `popover`
  - `sonner` (the shadcn Toast surface)
  - `command` (`cmdk` under the hood)
- Files land in `src/components/ui/<name>.tsx`, versioned with
  the repo. No runtime package imports for the UI layer; tree-
  shake cost is only what we import.
- Document the primitive surface in
  `docs/architecture/conventions.md` so future features reach
  for these instead of raw HTML.

**Token fill-in.**

- Add typography tokens to `@theme { ... }` in `src/index.css`:
  `--text-xs` … `--text-3xl` with matching line-heights
  (`--leading-tight/-normal/-relaxed`).
- Add shadow tokens: `--shadow-sm/-md/-lg` (Tailwind defaults
  are a fine starting point — copy them so we own the values).
- Add a z-index scale with five slots: `base`, `popover`,
  `dropdown`, `dialog`, `toast`. Primitives land on these by
  convention.

### Out

- Full shadcn install (table, calendar, select, etc). Picked up
  on demand.
- Visual refresh of Sidebar / Notes list — that is ADR-0016's
  `features/` refactor, in spec 0039.
- Workspace switcher UI (spec 0041).
- Share modal UI (spec 0040).
- Animation library. Sonner ships its own motion; everything
  else stays on CSS transitions gated by `prefers-reduced-motion`.
- Keyboard shortcut *help modal* (`?` showing all shortcuts) —
  candidate for a future small polish spec.
- Splash / onboarding screen — separate concern, not blocking
  this polish.

## Behavior (acceptance)

Every item is test-covered (Vitest for frontend, Rust test for
shortcut registration, existing perf gates unchanged).

1. **Shortcut fires on cold boot.** After a restart, pressing
   `Win+Shift+N` shows the window and lands the cursor in the
   editor within the 2 s UX budget. Backend test in
   `shortcuts.rs` asserts the new chord parses and regression-
   guards against documented-broken combos (Ctrl+Alt+N,
   Ctrl+Alt+Shift+N, Win+N, Win+Alt+N).
2. **Shortcut survives Windows default conflicts.** Manual test
   row: cross-check Windows 11 + Office 365 + OneNote installed;
   the new chord is not intercepted. Recorded in spec 0003's
   test plan notes.
3. **Stale configs migrate.** A `config.toml` with the pre-0042
   `Ctrl+Alt+*` defaults (or the transitional `Ctrl+Alt+Shift+*`
   ones) is rewritten to current defaults on boot. A customized
   set is left alone. Unit tests in `config.rs` cover both paths
   plus the no-op on the current defaults.
3. **Empty-state editor loads without CTA.** Cold boot on a
   vault with zero notes renders the editor (no button, no
   container card). Vitest snapshot asserts no `role="button"`
   with text matching `newNoteCta`.
4. **First keystroke persists draft.** In an integration test,
   simulate `keydown` on the editor: `create_note` is invoked
   exactly once, URL replaces to `/notes/<id>`, no flicker.
5. **Blur-empty discards.** Focus the editor, blur without
   typing: `create_note` is not called, no file on disk, no DB
   row. Assert via an integration test with a vault fixture.
6. **Blur-typed persists.** Focus, type one character, blur:
   `create_note` was called; save happens through the existing
   debounce path.
7. **shadcn primitives render with current tokens.** Vitest
   renders each primitive (`Dialog`, `DropdownMenu`, `Popover`,
   `Sonner`, `Command`) and asserts colours/radii resolve from
   `var(--*)` tokens (not hardcoded hex).
8. **Typography tokens replace default Tailwind.** A snapshot of
   `.bn-container` computed `font-size` matches
   `var(--text-base)`.
9. **Bundle growth capped.** Gzipped frontend bundle grows by
   ≤ 40 KB after the primitives land (measured in CI).
10. **Perf budgets unchanged.** `boot_smoke.rs` 2 s budget and
    `perf_new_note.rs` create/get 50 ms budget continue to pass.

## Design notes

**Why Win+Shift+N in the end.**

Initial attempt was `Ctrl+Alt+Shift+N`; it failed in the field
(likely because `config.toml` still carried the pre-0042
default). On re-testing we mapped Microsoft's actual Windows 11
shortcut list (`docs/research/shortcut-map.md`) and confirmed:

- `Win+Shift+N` is **not** in Microsoft's documented list. Free.
- `Win+N` is Notification Center — cannot touch.
- `Win+Alt+N` is OneNote Quick Note (global, documented) —
  this is the deep reason `Ctrl+Alt+N` behaved like it was
  "eaten by OneNote": users often have OneNote registered.
- `Ctrl+Shift+N` collides with Chrome / VS Code.
- `Ctrl+Alt+Space` was the runner-up; rejected because the
  user asked to use the Windows key and because launcher
  apps (PowerToys Run, Alfred-equivalents) sometimes claim
  `*+Space`.

**Empty-state draft lifecycle.**

- Lives only in the `NoteEditor` host state as a `pendingDraft`
  value (`Y.Doc` not created yet, only the placeholder markdown
  buffer).
- On first *meaningful* input (>= 1 non-whitespace character
  after a 200 ms idle — same debounce shape as the existing
  save path at 500 ms but shorter on create), fire `create_note`
  with the buffered markdown, receive `Note`, `router.navigate({
  to: '/notes/$noteId', params: { noteId }, replace: true })`,
  and continue the edit session on the persisted note.
- The BlockNote instance is recreated? No — the `Y.Doc` transfers.
  Simpler implementation: the transient draft's existing content
  is saved as the first `update_note` after `create_note` returns.
- Blur without input cleans the draft ref. No IPC.
- If the user navigates away via the sidebar while the draft is
  empty, same behaviour — discard.

**Why shadcn over raw Radix.**

- shadcn gives us source files with tokens already wired. Radix
  is the primitive under the hood; shadcn is the theming layer.
  Importing Radix direct means we write the theming ourselves —
  the cost of adopting shadcn is that it *writes it for us*, in
  a style the community maintains.
- shadcn source files get committed — not a package. We can
  edit them freely. That is the point.
- `@blocknote/shadcn` already puts shadcn classes in the source
  whitelist via `@source`; zero additional config for Tailwind 4
  to pick them up.

**z-index scale**

```css
@theme {
  --z-base: 0;
  --z-popover: 40;
  --z-dropdown: 50;
  --z-dialog: 100;
  --z-toast: 200;
}
```

**Typography scale**

```css
@theme {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

**Shadow scale** — start as copies of Tailwind defaults so the
visual language does not shift, then diverge if product wants:

```css
@theme {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

## Open questions

- **Shortcut migration** — new installs get the new default;
  existing installs pass through their `config.toml`. Users on
  the old default who never customised will stay on the broken
  combo unless we migrate. Proposal: on first boot after upgrade,
  if `config.toml` still matches the exact old defaults, rewrite
  to the new defaults with a one-line log entry. Reversible by
  editing config.toml.
- **Empty-state placeholder text** — literal string or i18n key?
  Proposal: i18n key (`editor.emptyPlaceholder`). Default English
  copy: "Type to start." Requires one short string.
- **First-character threshold** — exactly one keystroke, or wait
  200 ms for a burst? Proposal: 200 ms post-first-input debounce
  so pressing-and-releasing a modifier does not leak a file.
- **Should the new-note button in the sidebar stay or go?**
  Proposal: stays — it is an explicit affordance for "new note
  now without losing my current view" and the hotkey might be
  remapped.
- **Toast positioning** — bottom-right (Sonner default) vs
  top-right. Proposal: bottom-right, less likely to collide with
  dialogs that grow from the top.

## Test plan summary

- **Rust**: `shortcuts.rs` test asserts the new defaults parse
  and register without error on a stub `AppHandle`.
- **Vitest**: empty-state flow (no CTA renders; first-key →
  `create_note`; blur-empty → no call; blur-typed → save).
- **Vitest**: snapshot of primitive rendering; token resolution
  assertion (`getComputedStyle` pulls from `var(--*)`).
- **Vitest**: typography and shadow tokens reachable under
  `.bn-container`.
- **Integration** (existing): `perf_new_note.rs` and
  `boot_smoke.rs` are the regression gates — perf budgets
  unchanged.
- **Manual**: cross-check that Ctrl+Alt+Shift+N fires on a
  stock Windows 11 box with Office 365 installed (the recipe
  this spec was born from).
