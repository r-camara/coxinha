# Spec self-review — 0043 to 0050

Written 2026-04-20 as a fresh-eyes pass over the eight specs
drafted this session, before any mockup work starts. Flags
concerns, contradictions, scope creep, and gaps. Fixes land in
follow-up commits; this is the diagnostic.

Format per spec: **Works · Concerns · Gaps**. Cross-cutting
observations at the bottom.

---

## Spec 0043 — Command palette (Ctrl+K)

**Works**
- Unified surface (pages + actions + shortcut teacher) avoids
  Obsidian's two-hotkey split. Cleaner mental model.
- cmdk (shadcn `Command`) as the primitive — battle-tested,
  accessible out of the box.
- Command registry as a module that features self-register
  into. Good decoupling.

**Concerns**
- The "sub-palette for Switch workspace" flow adds state
  complexity (parent/child palette navigation). Could start
  with plain "Switch to …" actions flattened into the main
  list, with workspace names as entries. Simpler UX, one fewer
  code path. Revisit if the flat list gets cluttered.
- "Recently opened" empty-state shows 5 notes + 3 actions. On
  first run the recents are empty — what shows instead? Need
  an explicit "first run" branch in the design.
- No spec text on **mobile / small viewport** behaviour. Per
  DESIGN.md, mobile is out of F1 scope, but once spec 0022 web
  UI lands, Ctrl+K on narrow viewports needs a plan.

**Gaps**
- "Create-on-enter" for unmatched queries (Obsidian's quick-
  switcher pattern) noted as open question — should be
  decision, not question. **Recommend: include it, default
  on.** Typing a new title + Enter creates a note with that
  title in the active workspace's root folder. Shift+Enter
  forces creation even when a match exists.
- No story for **action with arguments** — e.g., "Switch
  workspace" needs a target. Current design: sub-palette.
  Alternative: inline argument input (the command row expands
  into an input when selected). Punt for F1; revisit.

---

## Spec 0044 — Trash with retention

**Works**
- Soft delete with filesystem as canonical. `.trash/` folder
  visible to external editors — preserves ADR-0002.
- Per-workspace retention config. Per-workspace trash
  storage.
- Audit trail in `history.jsonl` — consistent with ADR-0017.

**Concerns**
- **Restore-to-moved-folder** edge case not addressed. If
  the user trashed `notes/projects/coxinha.md` but later
  deleted the `projects/` folder, restore either has to
  recreate the folder or fall back to root. Current spec
  says "append `-restored`" for collisions — doesn't cover
  missing parents. **Recommend: if parent doesn't exist,
  auto-create it on restore.**
- The "Empty trash" confirm wording is strict ("type DELETE")
  only above 10 items or with items older than 30 days.
  Boundary case: exactly 10 items that are 29 days old →
  lenient confirm. OK, but document this explicitly in the
  acceptance criteria.

**Gaps**
- **Attachment orphaning** explicitly deferred to a follow-up
  spec, but nothing concrete on what that spec looks like.
  **Recommend:** add a one-line reference to "future spec:
  attachment lifecycle (orphan detection + cleanup)" so it
  doesn't get lost.
- The spec says "Exclude trash from FTS." Meetings spec 0007
  has meeting-specific search too — make sure the filter is
  applied there. Add a cross-reference.

---

## Spec 0045 — Nested notes tree

**Works**
- Filesystem-canonical tree rendering. No parallel hierarchy.
- Virtualization above 200 children — right trade-off.
- Drag-to-move is atomic and reverts on filesystem error.

**Concerns**
- **Recent pseudo-folder at top** is a special case in tree
  semantics. Feels clunky — the tree is "the file system", but
  the "Recent" entry isn't a folder. **Recommend:** either
  promote Recent to its own section ABOVE the tree (not
  inside), OR drop Recent entirely in favor of the command
  palette's recent-pages surface. First option is safer for
  discoverability.
- **Tags section still below the tree**. With tree + recent +
  tags, the sidebar's content panel has three scroll-
  competitive regions. That's dense. Consider making the
  TAGS section collapsible by default.
- **Rename-in-place** flow: the spec says "Validation: non-
  empty, slug-safe for the filename stem". Filename slug
  rules are in `storage.rs` — add a reference. What happens
  if the user types a slug-invalid character (accented
  letters, space)? Silently slug-transform, or reject?
  **Recommend: slug-transform silently, show the resulting
  slug in mono grey below the input** so the user sees what
  gets saved.

**Gaps**
- **Collapsed-group FTS** not addressed. If a folder is
  collapsed and the user searches, do matching items inside
  that folder cause the folder to auto-expand? Or just show
  in a flat "search results" override view? **Recommend:
  search results override the tree with a flat list; clearing
  the query returns the tree to its prior expand state.**

---

## Spec 0046 — Focus / compact mode

**Works**
- Elegant unification: Quick Capture IS focus mode.
- One shortcut (Ctrl+Shift+M) does both directions.
- Per-workspace default persisted in `.workspace.toml`.

**Concerns**
- **Spring timing cross-platform** is flagged as open
  question — should be tested on Windows 11 + a Linux dev
  setup before locking in 200/25.
- **React-Spring dep cost** — adds ~8 KB gzipped. Arguably
  worth it for one animation, but the token-scale discipline
  would push for a hand-rolled RAF spring (~20 lines).
  Revisit at implementation.
- The "Quick Capture window doesn't remember active tab from
  full shell" is implicit — the spec says "current tab stays
  active with its cursor position". Good. Make sure the
  integration test covers **multiple tabs** open when
  collapsing; currently it only tests one.

**Gaps**
- **Focus mode WITHOUT Quick Capture** — what if the user
  closed the Quick Capture window earlier, then launched
  Coxinha fresh, then hit Ctrl+Shift+M with an empty state?
  Creates a draft? Keeps current state? **Recommend:
  Ctrl+Shift+M from empty state creates a fresh draft in
  compact mode**, same as Win+Y would.

---

## Spec 0047 — Voice dictation

**Works**
- Clear scope (single-turn, reuses recorder pipeline).
- Separation from full meeting recording — prevents scope
  creep.
- Mic button only in Quick Capture — doesn't pollute full
  shell.

**Concerns**
- **Two-step trigger** (Win+Y then Ctrl+Shift+D) is high
  friction for the most common use case: "I want to capture
  a thought by voice **right now**". **Recommend:** add a
  second global shortcut `Win+Shift+D` that opens Quick
  Capture AND starts dictation in one gesture. The existing
  Ctrl+Shift+D toggles from inside the window.
- **Streaming transcriber abstraction** — Whisper-rs and
  Parakeet expose different streaming APIs. The spec says
  "abstract both behind the existing Transcriber trait" —
  non-trivial. May need a separate `StreamingTranscriber`
  trait. Flag as implementation risk.
- **Commit latency budget of 400 ms** — feasible for
  short dictations but may not hold if the user dictated
  for 30+ seconds. Need an interim spinner state.

**Gaps**
- **Language selection UI** — the spec defers to
  `config.transcriber.engine`. No way to override
  per-session. That's probably fine for F2, but for users
  who mix languages in notes it's a gap. Future spec.

---

## Spec 0048 — Calendar integration

**Works**
- Three providers (Google, Outlook, .ics) with a common
  read-only interface.
- Agenda strip density dots + event chips directly mirror
  Obsidian Calendar plugin — low-risk adoption.
- OAuth depends on specs 0024/0025 (not yet shipped);
  `.ics` fallback unblocks F2 ship.

**Concerns**
- **Privacy of attendee avatars** — the spec generates avatars
  from initials. Fine. But tooltip shows full email? Should
  we redact external addresses? For F2, probably show as-is
  (single-user local app).
- **Poll interval of 15 min** — misses meetings that got moved
  in the last 5 minutes. For the pre-meeting briefing (spec
  0035) this matters. **Recommend: polling is 15 min at rest
  but 2 min when within 10 min of a known event start.**
- **Multi-calendar overlap** dedup punted — OK, but the
  "show both with provider color hint" means we introduce
  provider color. That conflicts with DESIGN.md ("orange is
  the only non-neutral"). **Recommend: show both without
  color differentiation; provider shown only on chip hover.**

**Gaps**
- **Calendar event edit surface** — spec is read-only. But
  what if the user's meeting note has structured data that
  SHOULD write back (e.g., "decision: X")? That's a deeper
  integration. Future spec.
- **Timezone display** — falls back to OS. Flagged as open
  question. Fine for F2.

---

## Spec 0049 — Semantic link suggestions

**Works**
- Memory layer framing per ADR-0015 — AI-derived, dismissible,
  source-preserving. Clean.
- Local embeddings only (no cloud) — respects ADR-0002.
- 7-day dismissal memory scoped to `(phrase_hash, target)` —
  reasonable granularity.

**Concerns**
- **Threshold 0.72** is a guess. Spec flags as open question.
  In practice, per-language calibration likely needed — 0.72
  on English BGE might be 0.65 on Portuguese. Punt to F4
  implementation tuning.
- **Visual underline + floating `link` icon** — the floating
  icon is absolute-positioned. Risk of clipping at viewport
  edges or overlap with BlockNote's inline toolbar. Need to
  account for repositioning (flip to left of phrase if
  right-of-phrase would clip).
- **Performance 60 ms on 5 k-note vault** is aggressive.
  Depends heavily on SQLite VSS performance with 384-dim
  vectors. May need to batch the compare. Implementation
  risk flagged.

**Gaps**
- **Undo accept** — user accepts a suggestion, realizes it
  was wrong. Standard Ctrl+Z should rollback. Make sure the
  BlockNote undo stack captures the link replacement as a
  single operation, not two (delete phrase + insert link).
  Document this.

---

## Spec 0050 — Universal slash menu

**Works**
- Reuses spec 0043's command registry — zero duplicate
  definitions.
- Four clear categories (blocks / templates / actions /
  shortcuts).
- Context-aware relevance weighting is a nice extra.

**Concerns**
- **BlockNote's `suggestionMenuItems` API capability** is
  assumed but not confirmed. What if BlockNote doesn't
  support category sections or custom per-row borders?
  Fallback: single flat list with icon-based visual grouping
  via icon color. Flag as implementation risk.
- **Left-border color cue** contradicts DESIGN.md slightly —
  per-category colored borders add small color variation.
  "Orange is the only non-neutral" is the rule. **Recommend:
  drop the color-border idea; use subtle category headers
  in muted uppercase (same style as sidebar RECENT / TAGS)**.
- **Templates as slash items** — great idea, but if the user
  has 20 templates, the slash dropdown becomes cluttered.
  Needs prioritization (recency-of-use) and maybe a
  "/template" → sub-menu pattern.

**Gaps**
- **Slash at position other than line-start** — the spec says
  "same fuzzy-subsequence match as BlockNote default".
  BlockNote only opens the menu at block-start. Some users
  expect `/` mid-line to also open. Confirm behaviour.

---

## Cross-cutting observations

1. **The Orange-signal rule keeps getting tested.** Spec 0048
   (calendar provider colors), spec 0050 (per-category
   borders), spec 0045 (density dots colored when a day has
   events) all flirt with introducing more accent surfaces.
   Each recommendation above pulls back to neutral — good.
   But the PATTERN is: every new feature wants to add color.
   **Action:** add to DESIGN.md a rule of thumb: "Before
   introducing any non-neutral color on a new surface, verify
   we stayed under 3 orange appearances per screen."

2. **Keyboard shortcut surface is growing.** Today we have
   5 global hotkeys (Win+Shift+N/C/A/M/R) + Win+Y. Adding:
   Ctrl+K (palette), Ctrl+Shift+M (focus), Ctrl+Shift+D
   (dictate), Win+Shift+D (dictate + open). Plus the ?
   shortcut sheet (spec 0042). Plus future Ctrl+1..9 for
   workspaces. Feels like it's sprawling. **Action:** compile
   the running list into a single "shortcut atlas" doc
   before Wave 2 mockups, confirm no duplicates / conflicts.

3. **Workspace scope creep.** Many specs say "per-workspace"
   (trash retention, default mode, type templates, calendar
   accounts, semantic threshold). That's correct per ADR-0017,
   but means the `.workspace.toml` file is growing quickly.
   Spec 0041 lists only `{id, slug, name, description, icon,
   created_at}`. **Action:** spec 0041 needs an update
   documenting the full growth — or each per-workspace
   setting goes into `.coxinha/preferences.toml` with
   workspace-scoped sections.

4. **Command registry is a hot dependency.** Specs 0043, 0050
   both consume from it. Spec 0046 (focus mode) implicitly —
   "Toggle focus mode" should be a command in the registry.
   So does theme flip, workspace switch, etc. **Action:** the
   command registry deserves its own module spec — even
   though 0043 defines it — so that 0050 can build cleanly.
   Maybe a small addendum to 0043 explaining the registry
   interface in detail.

5. **Memory layer growth.** Spec 0049 writes to
   `.coxinha/memory/dismissed-links.json`. Spec 0035
   (pre-meeting briefing) will likely write to memory too.
   **Action:** document the `.coxinha/memory/` structure
   before the first Memory consumer ships. A mini-ADR or
   ADR-0015 addendum.

6. **Implementation risks** (non-blocking for design, but
   flagged):
   - Streaming transcriber trait (spec 0047)
   - BlockNote suggestionMenuItems API depth (spec 0050)
   - SQLite VSS perf under 5 k embeddings (spec 0049)
   - Tauri `Window::set_size` animation smoothness on
     Linux (spec 0046)

---

## Next actions from this review

Priority fixes to roll into the specs:

1. Spec 0043: flip "create-on-enter" from open question to
   default-on design decision.
2. Spec 0044: address restore-to-missing-parent (auto-create).
3. Spec 0045: drop "Recent pseudo-folder at top", promote
   Recent as a separate section. Document search-override-
   the-tree behaviour.
4. Spec 0046: cover Ctrl+Shift+M from empty-state / post-restart.
5. Spec 0047: add Win+Shift+D as one-shot "open + dictate".
6. Spec 0048: adaptive poll interval near event time. Drop
   provider color.
7. Spec 0049: document BlockNote undo stack behaviour on
   accepted link.
8. Spec 0050: drop per-category border color. Document
   slash-at-middle-of-line behaviour.
9. ADR-0015 addendum: `.coxinha/memory/` structure.
10. Spec 0041 addendum: `.workspace.toml` evolution policy.
11. Shortcut atlas doc: consolidate all hotkeys.

Opera research (running now) may add more. Plus mockup waves.
