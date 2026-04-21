# Opera One & modern browser UX

> Public sources only (opera.com, blogs.opera.com, help.opera.com, arc.net, resources.arc.net, vivaldi.com, help.vivaldi.com, and press). `[unverified]` = claim not pinned to a primary source. As of 2026-04-20. Focus: surfaces and interactions that inform a local-first desktop notetaker (Coxinha).

## 1. What Opera One broke from

Opera One (stable release April 2023) reframes the browser as a **modular, multithreaded shell** — UI pieces (tabs bar, sidebar, address bar, Aria panel) live outside the rendering process so the chrome stays responsive while pages load, and so modules can be composed or hidden independently. Positioning-wise this is Opera's differentiator against Chrome/Edge's "single fat row of tabs": a browser that behaves more like a windowed workspace than a document viewer. Source: [opera.com/one](https://www.opera.com/one), [techcrunch.com/2023/04/24/opera-launches-opera-one-browser-with-a-new-tab-grouping-concept](https://techcrunch.com/2023/04/24/opera-launches-opera-one-browser-with-a-new-tab-grouping-concept/).

## 2. Layout inventory

| Feature | Description | Default on? | Source URL |
|---|---|---|---|
| Vertical tabs | Not native. Horizontal tabs only; vertical layouts require extensions (Vertical Tabs, Tab Sidebar, V7 Tabs). | No (extensions) | [addons.opera.com/en/extensions/details/vertical-tabs](https://addons.opera.com/en/extensions/details/vertical-tabs/) |
| Tab Islands | Colored, collapsible tab groups auto-created from browsing context (links opened from a parent tab stay with it). Users can rename, recolor, move tabs between islands. | Yes | [opera.com/features/tab-islands](https://www.opera.com/features/tab-islands), [blogs.opera.com/desktop/2023/06/opera-tab-islands](https://blogs.opera.com/desktop/2023/06/opera-tab-islands/) |
| Workspaces | Up to 5 switchable tab containers with per-workspace icon + name. Icons live in the left sidebar. `Ctrl+Tab` cycles only within the active workspace. | Yes (1 default workspace, user adds more) | [opera.com/features/workspaces](https://www.opera.com/features/workspaces), [help.opera.com/en/latest/features](https://help.opera.com/en/latest/features/) |
| Sidebar messengers / docked tools | Left rail hosting Music Player, WhatsApp/Telegram/Messenger/Discord/Slack, Gmail, Google Calendar, pinned apps. Autohide available. | Partially (a few pinned; others opt-in) | [opera.com/one](https://www.opera.com/one) |
| Aria (AI assistant) | Right-side panel by default; also reachable via an inline **Command Line** overlay. | Yes (free, signed-in) | [opera.com/features/browser-ai](https://www.opera.com/features/browser-ai), [blogs.opera.com/desktop/2023/06/introducing-aria](https://blogs.opera.com/desktop/2023/06/introducing-aria/) |
| Aria Command Line trigger | `Ctrl+/` (Win) / `Cmd+/` (Mac) opens a centered overlay for quick Aria prompts; some keyboard layouts remap to `Ctrl+Shift+7`. | Yes | [blogs.opera.com/tips-and-tricks/2024/07/how-to-use-arias-new-capabilities-in-opera-one](https://blogs.opera.com/tips-and-tricks/2024/07/how-to-use-arias-new-capabilities-in-opera-one/) |
| Quick tab search / dispatcher | `Ctrl+Space` opens a search overlay for open + recently closed tabs. | Yes | [help.opera.com/en/latest/features](https://help.opera.com/en/latest/features/) |
| Popup (video) player | Floating always-on-top detached video window, draggable, resizable, with transparency slider; button appears on hover over any web video. | Yes | [opera.com/features/video-popout](https://www.opera.com/features/video-popout) |
| Split screen | Up to four pages side-by-side sharing one address bar / tab handle. | No (opt-in per session) | [opera.com/one](https://www.opera.com/one) |
| Tab preview on hover | Thumbnail preview when hovering a tab; toggle in Settings > Browser > User interface > "Show tab previews". | Off by default `[unverified]` | [help.opera.com/en/latest/browser-window](https://help.opera.com/en/latest/browser-window/) |
| Active tab indicator | Active tab rendered as a distinct "raised" pill with its island's accent color on the left handle; inactive tabs flat. `[unverified]` on exact pixel spec. | Yes | [blogs.opera.com/desktop/2023/06/opera-tab-islands](https://blogs.opera.com/desktop/2023/06/opera-tab-islands/) |

## 3. Workspaces — deep dive

- **Create**: three-dot menu at the bottom of the left sidebar > Sidebar setup > add a workspace, then pick a name + icon from a preset grid. Max 5 per profile. Source: [opera.com/features/workspaces](https://www.opera.com/features/workspaces).
- **Switcher location**: vertical stack of workspace icons at the top of the left sidebar — always visible, one-click switch. Source: [opera.com/features/workspaces](https://www.opera.com/features/workspaces).
- **Per-workspace state**: each workspace holds its own set of tabs and Tab Islands; pinned tabs and hidden tabs are per-workspace; `Ctrl+Tab` cycling is scoped to the active workspace. Source: [help.opera.com/en/latest/features](https://help.opera.com/en/latest/features/).
- **Customization**: name + icon chosen from Opera's icon grid (emoji-like glyphs). Background color isn't per-workspace in Opera — that's Arc's trick (section 5). `[unverified]` as of 2026-04.
- **Keyboard shortcuts**: no global default. User must assign via `opera://settings/keyboardShortcuts#OperaWorkspaces` (long-standing forum request). Source: [forums.opera.com/topic/45212/shortcuts-for-workspaces](https://forums.opera.com/topic/45212/shortcuts-for-workspaces).
- **"Which workspace am I in?"**: the active workspace icon gets a filled/highlighted background in the sidebar rail; tabs in the tab bar are scoped to that workspace (invisible workspaces' tabs aren't rendered). Source: [opera.com/features/workspaces](https://www.opera.com/features/workspaces). No full-window accent tint (Arc-style).

## 4. Tab Islands — what's actually smart

- **Auto-grouping logic**: a new tab opened **from a parent tab** (Ctrl+click, middle-click, in-page link) joins the parent's island. Manual `Ctrl+T` / new top-level tabs start a fresh island. No time-based or domain-based auto-grouping is documented. Source: [blogs.opera.com/desktop/2023/06/opera-tab-islands](https://blogs.opera.com/desktop/2023/06/opera-tab-islands/).
- **Visual presentation**: each island is a horizontal pill with a left-side colored handle (color auto-assigned, user-editable). Click the handle to collapse the island to a single chip; click again to expand. Shift-click to multi-select tabs; context menu to move tabs between islands. Source: [opera.com/features/tab-islands](https://www.opera.com/features/tab-islands).
- **User correction flows**:
  - Drag a tab out of an island to break it into a solo tab / new island.
  - Right-click a tab > "Move to island" > pick an existing island or "New island".
  - Merge: drag one island's handle onto another (or use context menu). `[unverified]` on exact merge gesture.
  - Since late 2024, Aria can group/pin/close tabs via natural-language commands ("group all my flight tabs"). Source: [techcrunch.com/2024/10/10/operas-new-feature-lets-you-group-pin-and-close-tab-through-natural-language-commands](https://techcrunch.com/2024/10/10/operas-new-feature-lets-you-group-pin-and-close-tab-through-natural-language-commands/).

## 5. Arc & Vivaldi — adjacent patterns worth stealing

### Arc (arc.net, The Browser Company)

- **Spaces**: left-sidebar-scoped "universes" — each with its own pinned list, theme (gradient color), and icon. Switch via `Ctrl/Cmd+1..9`, sidebar icon-strip click, or `Cmd+Opt+←/→` to cycle. Whole window re-tints to the space's gradient — a strong at-a-glance indicator. Source: [resources.arc.net/hc/en-us/articles/19228064149143-Spaces-Distinct-Browsing-Areas](https://resources.arc.net/hc/en-us/articles/19228064149143-Spaces-Distinct-Browsing-Areas).
- **Command Bar (`Cmd+T`)**: opens a unified omnibox/dispatcher over the current window; fuzzy-matches open tabs, history, bookmarks, and Arc commands (Download, Split, etc.). Tab key cycles command categories. Source: [start.arc.net/command-bar-actions](https://start.arc.net/command-bar-actions).
- **Split View**: up to 4 panes in one tab, keyboard-navigable between panes. Panes persist like a single tab. `[unverified]` on exact shortcut list.
- **Air Traffic Control**: rule-based auto-routing of external links to specific Spaces (e.g. `github.com` → Work space). `contains` / `is equal to` matchers; default fallback is "Little Arc" (a minimal popup window). Source: [resources.arc.net/hc/en-us/articles/22932014625431-Air-Traffic-Control-Automate-Your-Link-Routing](https://resources.arc.net/hc/en-us/articles/22932014625431-Air-Traffic-Control-Automate-Your-Link-Routing).

### Vivaldi (vivaldi.com)

- **Tab Tiling**: tile 2–N tabs in vertical / horizontal / grid / custom layouts. Shortcuts `Ctrl+F9 / F8 / F7` (vertical / horizontal / grid). Source: [help.vivaldi.com/desktop/tabs/tab-tiling](https://help.vivaldi.com/desktop/tabs/tab-tiling/).
- **Tab Stacks**: two-level grouping — stacks of tabs that collapse to one tab-strip item. Drag-to-stack, right-click to name. Source: [vivaldi.com/features](https://vivaldi.com/features/).
- **Panels**: docked side panel for web panels, notes, tasks, mail, feeds. Toggle with `F4` / `⌥⌘P`. Source: [help.vivaldi.com/desktop/panels/panels](https://help.vivaldi.com/desktop/panels/panels/).
- **Quick Commands**: `F2` / `⌘E` opens a fuzzy dispatcher over everything — open tabs, history, bookmarks, settings, any command. The deepest command palette of any browser. Source: [help.vivaldi.com/desktop/shortcuts/quick-commands](https://help.vivaldi.com/desktop/shortcuts/quick-commands/).

## 6. Gaps + wins — what a desktop notetaker can adopt

- **worth stealing** — **Global command palette with fuzzy dispatch** (Vivaldi Quick Commands / Arc Command Bar): single shortcut opens a palette that covers open notes, recent files, AND every action. Coxinha's `Ctrl+O` / action palette should merge navigation + command dispatch rather than keep them separate.
- **worth stealing** — **Workspace icon rail, always visible**: Opera's sidebar-top icon stack with filled-state active indicator. Tiny footprint, high affordance. Maps 1:1 to ADR-0017 workspaces.
- **worth stealing** — **Full-chrome tint per workspace (Arc)**: whole-window accent color removes the "wait, which one am I in?" question entirely. Cheaper than an icon badge and legible in peripheral vision.
- **worth stealing** — **Keyboard shortcuts to switch workspace by index** (`Ctrl+1..9`, Arc-style). Opera's lack of defaults is a documented user complaint.
- **worth stealing** — **Collapsible, colored groups in the file/tab list** (Tab Islands' colored left handle + click-to-collapse): for a notetaker this maps to folder-or-tag groupings in the explorer sidebar. Collapse behavior reclaims vertical space fast.
- **adapt with care** — **Auto-grouping by provenance** (parent-tab heuristic): useful as "notes created from this note" clustering in the tree, but only as an opt-in hint — documents aren't browsing sessions, so the grouping must be easy to dissolve.
- **adapt with care** — **Aria Command Line overlay** (`Ctrl+/`): a lightweight prompt that stays out of the editor. Good pattern for Coxinha's AI memory (ADR-0015) if and when it ships — but invariant says zero network in F1, so this lives behind local-only models.
- **not for us** — Aria cloud AI itself, sidebar messengers (Gmail/Slack/Discord), web panels, popup video player, per-tab container/privacy modes, Little Arc, Air Traffic Control URL routing.

## 7. Explicit non-copies

- **Tab tiling into a 4-way grid** (Vivaldi, Opera split screen, Arc Split View): browsers tile sites because sites are self-contained. Notes reference each other — a grid of four disconnected notes fragments attention. A single focused editor + a one-pane outline/backlinks sidecar is the right shape.
- **Popup video player**: out of scope; Coxinha doesn't render embedded video.
- **Web panel messengers**: Coxinha doesn't dock third-party apps; that's a browser affordance, not a notetaker one. Crosses the "local-first, no network" invariant.
- **Per-tab containers / privacy modes**: irrelevant to local files.
- **Air Traffic Control URL routing**: documents don't arrive from external sources with domain metadata; routing rules have no natural trigger.