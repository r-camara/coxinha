# Obsidian UX inventory

> Public docs only (obsidian.md, help.obsidian.md, forum.obsidian.md, GitHub). `[unverified]` = not confirmed in primary sources. As of 2026-04-20.

## 1. Shell

- **Vault = folder on disk.** Plain Markdown + hidden `.obsidian/` config; switching vaults = pointing the app at a new folder. No proprietary DB. Source: [obsidian.md/help](https://obsidian.md/help).
- **Three-column layout**: left sidebar (file explorer, search, bookmarks, tags), center editor, right sidebar (backlinks, outgoing links, outline, properties, tags). Both collapsible. Sidebar panes drag between sides or pull out into tabs. Source: [help.obsidian.md/User+interface](https://help.obsidian.md/User+interface).
- **Tabs**: `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle, `Ctrl+W` closes, drag a tab to an editor edge to split. Source: [obsidian.md/help/tabs](https://obsidian.md/help/tabs).
- **Stacked tabs**: right-click tab bar > "Stack tabs" — horizontal strip becomes vertical sliding columns. Source: [obsidian.md/help/tabs](https://obsidian.md/help/tabs).
- **Split panes**: "Split right" / "Split down" via tab context menu or drag. Built-in keyboard nav between panes is limited; *Pane Relief* community plugin extends it. Source: [forum.obsidian.md/t/keyboard-shortcut-switch-between-split-panels/43284](https://forum.obsidian.md/t/keyboard-shortcut-switch-between-split-panels/43284).
- **Graph / Canvas / Backlinks access** — ribbon icons + palette entries. Backlinks, Outgoing, Tags, Outline each a right-sidebar pane.

### Command palette vs Quick switcher — DISTINCT surfaces

| | Command palette (`Ctrl/Cmd+P`) | Quick switcher (`Ctrl/Cmd+O`) |
|---|---|---|
| Purpose | Run **any command** (toggle plugins, insert template, open settings, split right, etc.) | Open / create **notes** |
| Input matches | Command names, with fuzzy search | Filenames + aliases (frontmatter `aliases:`) |
| Enter behavior | Invokes the command | Opens the matching note; if nothing matches, creates a new note with that title |
| Rule of thumb | Seldom-used actions | The main navigation reflex |

Sources: [help.obsidian.md/plugins/command-palette](https://help.obsidian.md/plugins/command-palette), [help.obsidian.md/plugins/quick-switcher](https://help.obsidian.md/plugins/quick-switcher), [obsidian.rocks/for-beginners-and-pros-alike-the-command-palette-in-obsidian](https://obsidian.rocks/for-beginners-and-pros-alike-the-command-palette-in-obsidian/).

## 2. Signature interactions

- **Fuzzy command palette.** Typed subsequence, not substring. Covers every plugin-registered command. Source: [help.obsidian.md/plugins/command-palette](https://help.obsidian.md/plugins/command-palette).
- **Quick switcher create-on-enter.** Title matches no file + `Enter` creates a new note in the default folder. Aliases (YAML `aliases:`) indexed. `Shift+Enter` forces create even with matches `[unverified]`. Source: [forum.obsidian.md/t/quick-switcher-toggle-to-only-make-a-new-note-with-shift-enter-shortcut/48576](https://forum.obsidian.md/t/quick-switcher-toggle-to-only-make-a-new-note-with-shift-enter-shortcut/48576).
- **Slash menu — YES.** `Slash commands` core plugin: `/` at line start or after whitespace fuzzy-searches commands; `Enter` invokes, `Esc`/`Space` dismisses. Source: [help.obsidian.md/plugins/slash-commands](https://help.obsidian.md/plugins/slash-commands).
- **Link preview on hover.** Page Preview core plugin (on by default). Hover `[[link]]` (some builds need `Ctrl/Cmd`-hover) for a read-only popover. *Hover Editor* plugin makes it editable. Source: [help.obsidian.md/plugins/page-preview](https://help.obsidian.md/plugins/page-preview).
- **Block references / transclusion.** `[[Note^block-id]]` links, `![[Note^block-id]]` embeds (live). Same for headings: `[[Note#Heading]]` / `![[Note#Heading]]`. Typing `[[Note#^` opens a block picker that auto-assigns `^block-id`. Sources: [help.obsidian.md/How+to/Link+to+blocks](https://help.obsidian.md/How+to/Link+to+blocks), [forum.obsidian.md/t/theres-nothing-on-help-obsidian-md-describing-block-ids-and-references/54396](https://forum.obsidian.md/t/theres-nothing-on-help-obsidian-md-describing-block-ids-and-references/54396).
- **Drag-to-reorder blocks.** `[unverified]` Each block has a gutter handle; drag to reorder. Confirmed in user reports, not pinned to a specific help URL.
- **Properties (frontmatter) UI.** Obsidian 1.4+ renders YAML as a typed table above the note: text, number, date, datetime, checkbox, list, tags. Edits write back to YAML on disk. Source: [help.obsidian.md/Editing+and+formatting/Properties](https://help.obsidian.md/Editing+and+formatting/Properties).
- **Tag suggestion.** `#` opens a fuzzy list of vault tags. Right-sidebar Tags pane shows all tags with counts; tags also register as a frontmatter property type.

## 3. Canvas (built-in, Obsidian 1.1+)

- **Storage: `.canvas` = JSON Canvas 1.0.** `{ nodes: [...], edges: [...] }` + optional metadata. Node types: `text`, `file`, `link`, `group`. Edges: `fromNode`, `toNode`, optional `label`, `fromSide`/`toSide`, color. Open-sourced at `jsoncanvas.org`. Source: [obsidian.md/blog/json-canvas](https://obsidian.md/blog/json-canvas/).
- **Editing UI.** Infinite pan/zoom. Toolbar create actions: **add card** (text), **embed note from vault**, **embed media from vault**. Drag-from-file-explorer also drops a node. Source: [help.obsidian.md/plugins/canvas](https://help.obsidian.md/plugins/canvas).
- **Card types**:
  - **Text** — markdown stored inline in the `.canvas` JSON.
  - **Note / file** — embeds an existing vault file; edits sync back; participates in backlinks.
  - **Link (web)** — iframe-embedded URL.
  - **Media** — image/PDF/audio/video from vault.
  - **Group** — coloured labelled box; drag cards inside to move together.
- **Arrows / edges.** Drag from a card edge handle to another card. Directionality: none / one-way (default) / two-way. Edges can be labelled. Source: [obsidianstats.com/plugins/canvas-links](https://www.obsidianstats.com/plugins/canvas-links).
- **Note embedding.** File-cards render the live note; edits write to the `.md`; target note's backlinks pane lists the canvas as a referrer.
- **Canvas ↔ note linking.** Canvases linkable via `[[Board.canvas]]`. `![[Board.canvas]]` embeds a static preview `[unverified]`. Deep-linking to a specific card/group is **not** native — 3-year open request: [forum.obsidian.md/t/canvas-ability-to-link-to-a-specific-group-a-selected-section-a-card-of-a-canvas/49779](https://forum.obsidian.md/t/canvas-ability-to-link-to-a-specific-group-a-selected-section-a-card-of-a-canvas/49779).

## 4. Excalidraw plugin (by zsviczian)

Source: [github.com/zsviczian/obsidian-excalidraw-plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin).

- **Storage.** Since v1.2.0, `.excalidraw.md` Markdown files — YAML frontmatter + fenced block of Excalidraw JSON. Keeps drawings graph-view-visible, taggable, Dataview-queryable. Legacy `.excalidraw` JSON attachments still load.
- **Drawing UX.** Full Excalidraw canvas in a tab: shape toolbar (rect, diamond, ellipse, arrow, line, freedraw, text, image, eraser), **library** (reusable stencils), **templates** (preset stroke/color/opacity).
- **Scripting.** *Script Engine* (v1.5+) exposes `ExcalidrawAutomate`; scripts appear in the Tools Panel and bind to hotkeys via the palette. Integrates with QuickAdd, Templater, Dataview.
- **Export.** PNG / SVG auto-export, keep-in-sync. Per-file frontmatter: `excalidraw-export-transparent`, `excalidraw-export-dark`, `excalidraw-export-pngscale`.
- **Embed-as-image.** `![[drawing.excalidraw|400]]` renders the exported PNG/SVG inline at the pipe-sized width. Drag-drop from file explorer inserts this syntax. Drag *into* a drawing with `Shift` embeds a markdown file as a card.
- **Collaboration `[unverified]`.** Excalidraw core (excalidraw.com) has real-time multiplayer; the Obsidian plugin is **local-first** and the README documents no multiplayer mode. For co-editing, use the web app and re-import.

## 5. Meetings / daily notes / templates

Direct comparison to Coxinha's Agenda + Meetings.

- **Daily Notes (core).** Command "Open today's daily note" creates `YYYY-MM-DD.md` (Moment.js tokens configurable, e.g. `YYYY/MMMM/YYYY-MM-DD-dddd` to bucket by folder). Optional template prepended. Hotkey-bindable. Source: [help.obsidian.md/plugins/daily-notes](https://help.obsidian.md/plugins/daily-notes).
- **Calendar plugin (liamcain).** Right-sidebar month grid; each day cell shows a "meter" of daily word count. Click = open note, `Ctrl+Click` = open in split, `Ctrl+Hover` = page preview. Draggable out of sidebar, pinnable. Reads Daily Notes + Periodic Notes settings. Source: [github.com/liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin).
- **Templates (core).** Designate a folder; "Insert template" opens a fuzzy picker, inserts at cursor. Tokens: `{{date}}`, `{{time}}`, `{{title}}`. No native per-template hotkey — need *Hotkeys for templates* community plugin. Slash-insert routes through `/` > "Insert template". Sources: [help.obsidian.md/plugins/templates](https://help.obsidian.md/plugins/templates), [github.com/Vinzent03/obsidian-hotkeys-for-templates](https://github.com/Vinzent03/obsidian-hotkeys-for-templates).
- **Periodic Notes (liamcain, community).** Weekly / monthly / quarterly / yearly alongside daily; each cadence its own folder, filename format, template. Commands like "Open this week's weekly note" auto-create. Integrates with Calendar for week numbers. Source: [github.com/liamcain/obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes).

## 6. Gaps + wins vs a notetaker-with-recording like Coxinha

- **must-have** — Markdown-on-disk vault. Matches ADR-0015.
- **must-have** — Quick switcher with create-on-enter. Biggest reflex; a Markdown notetaker feels slow without it.
- **must-have** — Fuzzy command palette. Discovery + keyboard-first a11y in one surface.
- **must-have** — Page Preview hover for `[[links]]`. Table stakes once wikilinks exist.
- **must-have** — Typed Properties UI above the note. Maps cleanly to Coxinha's Knowledge layer.
- **obsidian-signature** — Slash menu wired to **every** registered command, not just insertions. Gives Coxinha a uniform invocation surface for `/meeting`, `/record`, `/summarize`.
- **obsidian-signature** — Block refs with auto-generated `^block-id` on `[[Note#^`. High-leverage for quoting inside meeting recaps.
- **obsidian-signature** — Canvas with text/file/link/group cards + labelled arrows, persisted as open JSON Canvas.
- **obsidian-signature** — Daily Notes + Calendar sidebar as first-class nav. Directly maps to Coxinha's Agenda.
- **Coxinha-extra** — Always-on recording + STT + speaker diarization. Obsidian has no native story; `obsidian-audio-recorder` records raw audio only.
- **Coxinha-extra** — Memory layer (AI-derived, dismissible, sourced). Obsidian is Knowledge-only; no suggestion-vs-fact separation.
- **Coxinha-extra** — Tray-resident + global hotkey new-note (`Win+Y`). Obsidian has no tray presence.
- **Coxinha-extra** — Structured meeting object (attendees, agenda, actions) as typed UI, not author-written YAML.

## 7. Explicit non-features to not copy

- **Heavy plugin ecosystem at launch.** Obsidian's community-plugin catalogue is moat + onboarding cliff ("which 40 plugins do I need?"). Ship opinionated defaults; no marketplace in F1.
- **Graph view as centrepiece.** Sells screenshots, rarely used. Vanity pixels for a meeting notetaker.
- **Dataview as a query language.** Inline `TABLE FROM #tag WHERE ...` turns notes into code and fights "plain Markdown".
- **Community theme marketplace.** Theming surface area drags support cost. Ship two polished themes (light/dark), stop.
- **Per-template hotkeys via a plugin.** If templates matter, bind them first-class in settings.
- **Canvas without deep-linking.** Don't ship an infinite canvas that can't be linked at card granularity — the 3-year-old open request is a warning.
- **Workspace-switching complexity** (stacked tabs, sidebar panes that pull out into tabs, pinning sidebar views into main area). Support load disproportionate to use.
