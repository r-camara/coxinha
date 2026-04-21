# Notion flow & screen inventory

Research date: 2026-04-20. Public sources only (notion.com help
center, Notion blog). Anything I could not verify from a public page
is tagged `[unverified]`.

## 1. Top-level shell

Three-region layout, verified on the marketing and help pages:

- **Left sidebar** — workspace switcher (top), Search, Home,
  Inbox, then Library / Favorites / Teamspaces / Shared / Private;
  Settings, Templates, Trash at the bottom.
  ([navigate-with-the-sidebar][1])
- **Main pane** — current page (title, optional icon/cover,
  properties, block-stream body).
- **Right-side panel** — comments / page info / references;
  opened on demand. `[unverified]` exact trigger labels.

```
+-------------------------+---------------------------------+-----------+
| [Workspace v]           |  [cover image]                  |           |
| Search   Home  Inbox    |  [icon]  Page Title             | Comments  |
| -- Library --           |  properties...                  | / info    |
|  Favorites              |                                 | (toggle)  |
|  Teamspaces             |  body blocks                    |           |
|  Shared                 |  (type "/" for slash menu)      |           |
|  Private                |                                 |           |
|                         |                                 |           |
| Settings Templates Trash|                                 |           |
+-------------------------+---------------------------------+-----------+
```

## 2. Screen inventory

| Screen | Entry | What's on it | Source |
|---|---|---|---|
| Workspace switcher | Top-left sidebar dropdown | Current workspace name, list of other workspaces, "Add another account", "Create or join a workspace", log out | [1] |
| Blank / new page | `Ctrl+N`, or `+` in sidebar | Empty canvas with placeholder "Untitled" title; hover reveals "Add icon", "Add cover", "Add comment"; slash menu inline | [2], [5] |
| Filled page | Click a page in sidebar | Optional cover banner, emoji/image icon, title, property row (if in a db), stream of blocks | [2] |
| Database — Table view | Open a database; default view | Rows = pages, columns = properties; view tabs across top; filter/sort/group controls | [3] |
| Database — Board (kanban) | "+ Add view" → Board | Cards grouped by a select/multi-select/person property; drag cards between columns | [3] |
| Database — Calendar | "+ Add view" → Calendar | Month grid with pages placed on a date property | [3] |
| Search / command palette | `Ctrl+K` or `Ctrl+P` | Typeahead over page titles + recently viewed; no separate "command mode" surfaced in docs `[unverified]` | [4] |
| Share modal | "Share" button top-right of any page | Invite by email, General access dropdown ("Anyone on the web with link"), per-person permission levels (Full access, Can edit, Can comment, Can view) | [6] |
| Settings & members | Sidebar → Settings | Tabs for workspace settings, People/Members, Security, Allowed email domains; role chooser (Workspace owner / Membership admin / Member) | [7] |
| Comments on a block | Hover block → `⋮⋮` handle → Comment, or select text → Comment, or `Ctrl+Shift+M` | Thread anchored to block; "Default" shows threads in right gutter, "Minimal" shows icon you click to open | [8] |
| Trash | Sidebar bottom → Trash | Searchable list of deleted pages, restore icon, 30-day auto-purge | [9] |
| Onboarding / first-run | Sign-up flow at notion.com | `[unverified]` — Notion's public help category exists but the actual signup screens are behind login. Public blog screenshots show a template-picker step and a "what will you use Notion for?" questionnaire `[unverified]` | [10] |

## 3. Signature interactions

- **Slash command menu** — type `/` anywhere in a page to open a
  searchable menu of block types, turn-into commands (`/turn...`),
  color commands (`/red`), and utility commands (`/comment`,
  `/duplicate`). [5]
- **Drag-to-reorder / drag-to-nest** — the `⋮⋮` handle on hover
  lets you drag any block; dragging right nests it under the block
  above. `[unverified]` as a help-article quote, but standard in every
  public demo video. [8]
- **@-mentions** — `@` opens a picker for pages, people, or dates;
  mentioning a page auto-creates a backlink; `@remind` + time creates
  an inline reminder. [11]
- **Indented page tree in sidebar** — each page can contain
  sub-pages; sidebar shows them as a collapsible tree under Private /
  Shared / each teamspace. [1]
- **Inline page links with hover preview** — typing `@` or pasting
  an internal URL produces an inline mention; hovering shows a preview
  card. `[unverified]` exact hover-preview behavior from help docs; widely
  shown in public product demos.
- **Duplicate / Move to / Lock** — available on a page's `...`
  menu; "Move to" opens a workspace picker, "Lock" freezes edits. [9]
- **Template gallery** — sidebar → Templates opens a popup of the
  full notion.com/templates catalog; search by keyword, team,
  category, creator. [12]

## 4. Gaps vs a local-first notetaker like Coxinha

Current Coxinha mockup scope: Notes, Quick capture, Agenda, Meetings,
Settings. Public Notion surfaces Coxinha doesn't yet visibly cover:

- **Global search / command palette** — **must-have**. Every modern
  text tool has `Ctrl+K`. [4]
- **Page tree in a sidebar (nested hierarchy)** — **must-have**
  for anything beyond a flat notes list. [1]
- **Backlinks / inline page references** — **worth stealing**.
  Links to other notes + an automatic backlinks panel is table stakes
  for serious note apps (Obsidian, Logseq, Bear all ship it). [11]
- **Slash-command block menu** — **worth stealing**. Drastically
  lowers the cost of inserting checklists, code blocks, headings in a
  plain-Markdown editor. [5]
- **Trash with a retention window** — **must-have**. Plain
  filesystem delete is destructive; a local "Trash" folder with
  restore is almost free to build. [9]
- **Templates for new notes** — **worth stealing**. Meeting-note
  and daily-note templates are the 80% use-case. [12]
- **Comments on a note** — **Notion-specific**. Single-user,
  local-first tool: optional — could reuse as margin annotations, but
  the cloud-collab framing doesn't map.
- **Share modal / permission levels** — **Notion-specific**.
  Coxinha invariants say zero network in F1 — skip.
- **Database views (table/board/calendar)** — **Notion-specific**.
  Coxinha is plain Markdown; a structured-data product is a different
  shape. The Agenda screen already borrows the "calendar over notes"
  idea without needing a full db engine. [3]
- **Workspace switcher / teamspaces** — **Notion-specific**.
  One vault, one user. Skip.
- **Right-side references panel** — **worth stealing** as a
  backlinks/related-notes panel, minus the comments angle.

## 5. Explicit non-features

Confirmed from public sources; **not worth copying** for Coxinha:

- **Page icons / cover images** — ADR-0002 keeps notes as plain
  Markdown; emoji+cover live outside the file and would require a
  sidecar or frontmatter. Cosmetic-only. [13]
- **Cloud databases with multiple views** — out of product scope;
  would force a schema on top of plain Markdown. [3]
- **Teamspaces hierarchy** — different product shape (multi-user
  orgs); collides with Coxinha's single-vault filesystem model. [1]
- **AI "ask your workspace"** — requires cloud embeddings +
  network. F1 invariant is zero network. `[unverified]` on the exact
  current branding (Notion AI surface changes frequently).
- **Share-to-web / publish-page** — network feature; skip.
- **Inbox / notifications center** — no remote events to notify
  about in a local-first single-user app. [1]

---

## Sources

- [1] https://www.notion.com/help/navigate-with-the-sidebar
- [2] https://www.notion.com/help/guides/page-icons-and-covers
- [3] https://www.notion.com/help/guides/using-database-views
- [4] https://www.notion.com/help/keyboard-shortcuts
- [5] https://www.notion.com/help/guides/using-slash-commands
- [6] https://www.notion.com/help/sharing-and-permissions
- [7] https://www.notion.com/help/workspace-settings
- [8] https://www.notion.com/help/comments-mentions-and-reminders
- [9] https://www.notion.com/help/duplicate-delete-and-restore-content
- [10] https://www.notion.com/help/guides/category/onboarding
- [11] https://www.notion.com/help/guides/reminders-and-mentions
- [12] https://www.notion.com/help/guides/the-ultimate-guide-to-notion-templates
- [13] https://www.notion.com/help/customize-and-style-your-content
