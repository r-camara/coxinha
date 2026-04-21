# Spec 0050: Universal slash menu (commands beyond blocks)

- **Status:** draft
- **Phase:** F2 (after command registry from spec 0043 lands)
- **Owner:** Rodolfo
- **Depends on:** spec 0043 (command palette + command
  registry), BlockNote slash menu customization API
- **Relevant ADRs:** ADR-0013 (a11y), ADR-0016 (client shell)
- **Layer:** Outputs (invocation surface inside the editor)

## Why

BlockNote's slash menu is **insert-only**: `/heading`,
`/paragraph`, `/list`, `/code` etc. insert block types.
Obsidian's core Slash Commands plugin wires `/` to **every
registered command** — toggle dark mode, insert template,
start recording, open settings. Same character, much broader
surface. The muscle memory pays off immediately.

With the command registry from spec 0043 already holding every
app-level action (new note, switch workspace, toggle theme,
rebuild index, open trash, etc.), extending BlockNote's slash
menu to also surface those costs almost nothing — and gives
the user a single `/` for "anything that can be done from
here".

## Scope

### In

- **Extend BlockNote's slash menu** with custom items sourced
  from the `CommandRegistry` (spec 0043). Done via BlockNote's
  `suggestionMenuItems` API.
- **Sections** in the slash dropdown, in this order:
  1. **Blocks** — BlockNote's built-in (heading, paragraph,
     list, todo, quote, code, image, divider,
     mermaid (spec 0011), excalidraw (spec 0012))
  2. **Templates** — if any `.coxinha/types/<slug>.yml`
     define templates, list them here. Select = inserts the
     template body at cursor
  3. **Actions** — commands from the registry (new note, new
     daily note, switch workspace, toggle theme, start
     recording, open trash, open settings, rebuild index)
  4. **Shortcuts help** — chord mirror (type `/agenda` →
     reveals `Win+Shift+A`)
- **Filter behaviour** — same fuzzy-subsequence match as
  BlockNote default. Typeahead prunes all sections.
- **Context sensitivity** — actions that make sense in the
  current context come first. Example: when the editor is
  inside a daily note, "Start recording" ranks higher; when
  inside a meeting summary, "Regenerate summary" appears.
  Weight via a `relevance(route, blockType)` callback on
  each command registration.
- **Keyboard nav:** arrow keys navigate all sections. Enter
  invokes. Escape closes.
- **Visual consistency:** use the same token set as the
  command palette (same row height, same icon placement).
  The slash menu is a smaller surface — drop the section
  headings, use a subtle left-border color per category
  instead.
- **I18n:** every command label keyed.

### Out

- **Rebinding slash to another character** — `/` only.
- **Deep custom user-added commands** (via a scripting API) —
  AnyType / Obsidian have this. For F2 we ship the fixed
  registry from spec 0043 + templates. Custom actions are
  a follow-up if requested.
- **Cross-workspace actions** — slash commands operate on
  the active workspace.
- **Deferred block types** — `/embed` (remote URL), `/query`
  (dataview-like) — explicitly not adopted.

## Behavior (acceptance)

1. **Slash opens** and shows the combined menu (blocks +
   templates + actions + shortcuts help).
2. **Typeahead filters** across all four sections.
3. **Select a block item** inserts the block as before
   (BlockNote default behaviour unchanged).
4. **Select an action** fires the command's `run()`. Editor
   loses focus only if the command opens a modal / navigates
   away.
5. **Select a template** inserts the template body at cursor,
   preserving surrounding content.
6. **Relevance-weighted** — `relevance()` returning a higher
   score floats that command up. Unit test with a mocked
   registry.
7. **Keyboard nav** covers all sections seamlessly.
8. **A11y:** dropdown has `role="listbox"`, items
   `role="option"`; screen reader announces category when
   focus enters a new section.
9. **Budget** — open-to-render ≤ 60 ms on a vault with
   1 k notes and 50 registered commands.

## Design notes

- **BlockNote integration** — BlockNote exposes
  `suggestionMenuItems` on the editor config. We pass a
  merged list: default block items + items synthesized from
  `useCommands()` registry + template items from
  `.coxinha/types/*.yml`.
- **Template loading:** templates are read once at workspace
  load and refreshed on `set_variables`/workspace change.
- **Category separators:** subtle uppercase category headers
  (same style as sidebar `RECENT` / `TAGS`) — Geist 10 px,
  `letter-spacing: 0.08em`, `$color-steel-grey`, with a 4 px
  top-margin on each category after the first. No per-
  category colored border on rows — that would introduce
  color variation that fights the DESIGN.md orange-only
  rule. Icons per row carry the semantic cue.
- **Icon placement:** each row gets a 16 × 16 Lucide icon on
  the left of the border. Blocks get their type's icon
  (paragraph = `type`, list = `list`, etc.); actions get
  their semantic icon.
- **Command registry reuse** — `CommandRegistry` (spec 0043)
  is the single source. This spec does NOT duplicate the
  action list; it consumes.
- **Relevance examples** (to be wired when features exist):
  - In daily note: `start-recording` +10, `new-meeting-note` +5
  - In meeting summary: `regenerate-summary` +10,
    `start-recording` -5 (recording already happened)
  - In settings: everything action-class +0 (no context
    boost there)

## Open questions

- **Command shortcut inline** — when a command has a hotkey
  registered, show the chord on the right of the row? E.g.,
  "Switch workspace    Ctrl+K  w". Probably yes; tight
  design constraint.
- **Slash in the middle of a word** — BlockNote's default
  skips slash when it's part of an existing word. Verify
  we inherit the behaviour when extending.
- **Template preview on hover** — show the first 4 lines of
  a template before committing? Might be overkill for F2.
- **Nested slash commands** — `/template > meeting > 1:1`?
  For F2 flat; nested is a follow-up if templates grow
  many.

## Test plan summary

- **Vitest**: extended slash menu render, category order,
  typeahead filter across sections, keyboard nav, action
  fires.
- **Unit**: relevance-weighted sort with mocked registry.
- **Integration**: template load from workspace, insert
  flow commits to the editor correctly.
- **Perf**: 1 k-note + 50-command fixture, 60 ms budget.
