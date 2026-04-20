# Spec 0049: Semantic link suggestions

- **Status:** draft
- **Phase:** F4 (depends on embeddings)
- **Owner:** Rodolfo
- **Depends on:** spec 0030 (embeddings), spec 0013 (wiki-links)
- **Relevant ADRs:** ADR-0015 (Memory layer — AI-derived,
  dismissible, always sourced)
- **Layer:** Memory (AI-derived suggestions, never
  authoritative)

## Why

Wiki-links (`[[Note]]`) are only as useful as the user
remembering to type them. In practice, most notes that COULD
link to an existing note don't — the user writes "the
architecture decision we made last week" instead of
`[[Arquitetura de sync]]`.

With local embeddings (spec 0030), we can surface
"this phrase you just typed is semantically close to an
existing note; want to link it?" — inline, non-intrusive, Tab
to accept.

This sits squarely in the Memory layer per ADR-0015: the
suggestion is AI-derived, the user can dismiss it, and every
accepted link traces back to the source note.

## Scope

### In

- **Live suggestion surface** — while typing in BlockNote, the
  last 8–12 words of the current paragraph are periodically
  (every 800 ms idle) embedded and compared against all
  notes in the active workspace via cosine similarity.
- **Match threshold:** cosine ≥ 0.72 (tunable). Below, silent.
- **UI affordance:** matching phrase gets a subtle Steel
  underline with a small Lucide `link` icon floating to its
  right (absolute-positioned, non-interactive when it
  shouldn't be). Hover shows a tooltip: "Link to
  [[<TargetTitle>]]? (Tab)".
- **Accept flow:** pressing `Tab` when the cursor is at the
  end of the matched phrase replaces the phrase with
  `[[TargetTitle]]` as a proper wiki-link. `Esc` dismisses
  the suggestion for this phrase.
- **Dismiss-per-note-memory:** a dismissed suggestion for a
  given (phrase, target) pair is remembered for 7 days —
  stored in `.coxinha/memory/dismissed-links.json` per
  ADR-0015 Memory conventions.
- **Multi-target:** when the top-1 match is > 0.85, offer it
  as the default (Tab accepts). When top-1 < 0.85 but top-3
  all over threshold, Tab opens a small popup with the 3
  options.
- **Indexing strategy:** embeddings are indexed on
  `update_note`. Initial vault scan on first boot after
  spec 0030 ships. Background thread.
- **Performance guard:** suggestion lookup must complete in
  under 60 ms for a 5 k-note vault. Above that threshold,
  visual underline delays until the next idle cycle rather
  than blocking typing.
- **Confidence labeling:** accepted suggestions leave a
  trace in `history.jsonl`: `{ts, op: "link_accept",
  source_note, target_note, phrase, confidence}`. Not
  user-surfaced, but audit-preserving per ADR-0015.

### Out

- **Cross-workspace suggestions** — workspace-scoped only
  in F4.
- **Link suggestion for Obsidian-style aliases** — use only
  note titles + first heading. Frontmatter `aliases:` is
  a future extension.
- **Generating NEW notes from a suggestion** ("this phrase
  looks like a concept — want to create a note?") — over
  the line into Memory-generates-Knowledge. Punt.
- **Bidirectional suggestion** ("this note is being linked
  often; consider canonicalizing") — dashboard feature,
  future.
- **Sentence-level embeddings** — phrase-level (8–12 words)
  is cheaper and sharper.

## Behavior (acceptance)

1. **Underline appears** when typing a phrase close to an
   existing note. Vitest with a mocked embedding function
   that returns predictable similarity.
2. **Tab accepts** — phrase replaced with `[[Target]]`,
   cursor lands after the link.
3. **Esc dismisses** for the session.
4. **Dismiss persists** for 7 days — reloading the note
   with the same phrase does not re-surface the dismissed
   suggestion. Rust integration test on the
   dismissed-links.json.
5. **Top-3 popup** for ambiguous matches. Arrow keys + Enter
   pick. Esc closes.
6. **No underline** when threshold not met. Silent.
7. **Indexing on save** — editing a note triggers
   re-embedding. Test: edit → save → check the embedding
   cache updated.
8. **History trace** — each accept appends a
   history.jsonl line with confidence, source, target.
9. **Budget** — suggestion lookup ≤ 60 ms on 5 k-note
   fixture. Integration perf test.

## Design notes

- **Visual design:** the underline is a 1 px dashed Steel
  line. The floating `link` icon is 10 × 10, positioned
  absolutely after the phrase, margin-left 4 px. On accept,
  the phrase and underline animate into the wiki-link color
  (Coxinha Orange for pills? no — per DESIGN.md restraint,
  keep it Ink Coffee with a thin Orange underline).
- **Tooltip** shows the target note's title + first 120
  chars of body. Delayed 300 ms.
- **Memory layer integration** — dismissed suggestions go
  into `.coxinha/memory/dismissed-links.json`:
  ```json
  {
    "version": 1,
    "dismissals": [
      {
        "phrase_hash": "sha256:...",
        "target_note_id": "018f...",
        "dismissed_at": "2026-04-20T10:00:00Z",
        "expires_at": "2026-04-27T10:00:00Z"
      }
    ]
  }
  ```
- **Embedding backend:** per spec 0030, local ONNX model
  (candidate: bge-small or similar — 384-dim). Indexed in
  SQLite VSS or equivalent (spec 0031). We don't re-design
  that here; we consume.
- **Suggestion dispatcher:** a Rust command
  `suggest_links(workspace_id, phrase) -> Vec<{note_id,
  title, similarity}>` returns ranked candidates. The
  editor-side debounce + extracts the current phrase.
- **Internationalization:** the model must handle PT + EN.
  Multilingual bge variants exist; confirm during spec 0030.
- **Accessibility:** the underline gets an
  `aria-describedby` pointing at a screen-reader-only
  description "Possible link to {TargetTitle}. Press Tab
  to accept." — so keyboard-only users don't miss it.

## Open questions

- **Auto-trigger vs manual** — always on (risk: noisy for
  power users) vs a `Alt+L` hotkey to scan current
  paragraph? Proposed: always on, with a Settings toggle
  to disable.
- **Threshold per user** — 0.72 is a guess. Let users tune?
  Proposed: hidden in Settings → Advanced.
- **Phrase extraction strategy** — last N words is crude;
  noun-phrase detection would be better but requires more
  NLP. Proposed: start with last-N and iterate.
- **Cold-start path** — first day with 5 notes, the
  embeddings are sparse. Probably no suggestions fire. OK
  as long as the experience doesn't degrade later.

## Test plan summary

- **Vitest**: underline render under fixtured similarity,
  Tab-accept integration, Esc dismiss.
- **Rust**: suggest_links command round-trip with a stub
  embedder returning predetermined similarities.
- **Integration**: dismissed-links.json persistence across
  edits.
- **Perf**: 5 k-note fixture, 60 ms lookup budget.
