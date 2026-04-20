# Design System: Coxinha

> Anti-cliché design doctrine for the Coxinha desktop notetaker.
> Feeds `pencil` CLI prompts and any AI-assisted design / frontend
> work. Single source of truth for aesthetic direction.

---

## 1. Visual Theme & Atmosphere

**"Quiet tool."**

Coxinha is a local-first Windows notetaker that doubles as a
meeting recorder — an app the user opens dozens of times a
day. The UI is a working surface that has to **disappear**
during use. A palette or typography that shouts ends up
tiring.

Revised direction (2026-04-20): neutral Zinc baseline with
Coxinha Orange reserved as a precise signal — not a pervasive
warm wash. Think Arc Browser's restraint, Linear's neutrality,
iA Writer's typographic discipline — *not* Bear's warm paper
or Notion's corporate-purple accents. The first draft of this
doc leaned into a warm cream aesthetic; user feedback flagged
it as fatiguing for constant use. Restraint wins.

**Atmosphere axes:**

- **Creativity: 6/10** — distinctive through restraint, not
  saturation. The goal is "recognizable without being loud".
- **Variance: 6/10** — offset asymmetric; reading column
  centered on wide viewports with deliberate negative space on
  either side.
- **Density: 5/10** — daily-app balance; sidebar carries work,
  main pane stays content-primary.
- **Motion: 4/10** — fluid but restrained. Motion communicates
  state (draft becoming persisted, save completing), not
  delight. This is not a consumer toy.

**Reference points (acknowledged, not cloned):**

- *Arc Browser* — disciplined neutrals with a single accent
  used surgically. This is the closest aesthetic match.
- *Linear* — neutral Zinc palette, weight-driven hierarchy,
  speed-of-thought motion.
- *iA Writer* — reading-column discipline and typographic
  weight.
- *Notion* — content-first minimalism + left-rail chrome.
  Rejected: page-icon culture, template galleries,
  database/kanban metaphors, generic "Elevate" voice.
- *Obsidian* — filesystem-canonical honesty and wiki-link
  primitives.

**Voice:** plain, direct, Brazilian warmth without folkloric
cliché. The name is a Brazilian savory snack. Lean into craft
and precision — never into "tech startup".

---

## 2. Color Palette & Roles

Neutral Zinc baseline. Coxinha Orange appears **only** as a
signal for user-driven action or system state — the "+ New"
button, save-pending dot, active tag filter, focus rings.
Everywhere else is gray. If the orange shows up more than
three times on a screen, something is wrong.

Pure black is banned.

### Light mode

| Name | Hex | Role |
|---|---|---|
| **Canvas** | `#FAFAFA` | Primary background surface (Zinc 50, neutral-warm) |
| **Surface** | `#FFFFFF` | Card / elevated / popover fill |
| **Stone** | `#F4F4F5` | Sidebar background (Zinc 100). Sits under the main canvas in depth order. |
| **Ink** | `#18181B` | Primary text (Zinc 950). Not pure black |
| **Steel** | `#71717A` | Secondary text, metadata, timestamps (Zinc 500) |
| **Line** | `#E4E4E7` | Borders, dividers, 1px structural separators (Zinc 200) |
| **Hover** | `#F4F4F580` | Neutral tint for active nav item backgrounds — no orange wash |
| **Coxinha Orange** | `#DE8C3A` | Single accent. CTAs, save-pending dot, active tag pill, focus ring. Saturation 69% (under 80% ceiling). Appears sparingly |
| **Orange Trace** | `#DE8C3A14` | 8% orange — reserved for one specific signal (active note in sidebar list). Everywhere else uses Hover |
| **Alarm Red** | `#B91C1C` | Destructive actions only. Never decorative |

### Dark mode

| Name | Hex | Role |
|---|---|---|
| **Canvas** | `#0C0C0D` | Background — near-black neutral, not warm charcoal |
| **Surface** | `#18181B` | Elevated surface (Zinc 950) |
| **Stone** | `#151517` | Sidebar background |
| **Ink** | `#F4F4F5` | Primary text |
| **Steel** | `#A1A1AA` | Secondary text |
| **Line** | `#27272A` | Borders (Zinc 800) |
| **Hover** | `#FFFFFF08` | 3% white tint for active backgrounds |
| **Coxinha Orange** | `#DE8C3A` | Unchanged across modes — the brand stays constant, the surfaces flip |
| **Orange Trace** | `#DE8C3A1F` | 12% orange on dark — a touch more visible since dark surfaces swallow transparency |
| **Alarm Red** | `#DC2626` | Slightly brighter for dark-surface contrast |

### Strict bans

- Pure black `#000000` — use `Ink` or `Canvas` (dark).
- Warm-tinted greys or cream backgrounds — the earlier "cream
  paper + coffee ink" direction was rolled back because the
  warmth read as tiring for constant-use daily work. Stay on
  Zinc neutrals.
- More than one accent colour. Orange is the only non-neutral
  in the system.
- Orange as a pervasive wash (sidebar fill, full-width banner,
  large filled cards). Orange is a **signal**, not a
  background.
- Purple, indigo, neon gradients, rainbow hovers.
- Destructive red as decoration (banners, badges). Red is
  reserved for "this action will delete something".

---

## 3. Typography Rules

Inter is banned. Generic serifs are banned in every UI context.

| Role | Font | Notes |
|---|---|---|
| **Display / headings** | **Geist** 600 | View titles ("Agenda", "Settings"), sidebar brand, document title. Track-tight (`letter-spacing: -0.02em` at display sizes). Weight-driven hierarchy — never massive size. |
| **Body / UI** | **Geist** 400 / 500 | All reading content + UI text. Leading 1.6. Max-width 65ch on prose. Medium (500) for active nav, section headings, pill labels. |
| **Mono** | **Geist Mono** | Code blocks, file paths, `<kbd>` keys, timestamps, numeric metadata. Tabular digits. |

Why Geist: single-family pairing keeps the type system compact
(one display/body font instead of two), and it is the font the
Pencil design tool actually has in its library — Cabinet
Grotesk + Satoshi were the original picks but would have
silently fallen back to a generic sans in any Pencil-rendered
mockup. Geist lines up with taste-design's allowed font list,
avoids the banned Inter, and has a matching Mono. In code we
load via `@fontsource/geist` + `@fontsource/geist-mono` so the
vault chrome renders the same as the mockups.

**Scale** (Tailwind-compatible tokens):

```
--text-xs:   0.75rem  / line-height 1.25
--text-sm:   0.875rem / line-height 1.4
--text-base: 1rem     / line-height 1.6   (body default)
--text-lg:   1.125rem / line-height 1.5
--text-xl:   1.25rem  / line-height 1.4
--text-2xl:  1.5rem   / line-height 1.3
--text-3xl:  1.875rem / line-height 1.25
```

**Section headings** (sidebar "RECENT", "TAGS"): 10px (0.625rem)
Satoshi Medium, letter-spacing 0.08em, uppercase, Steel Grey
colour. No icon before the heading — the word is the signal.

**Serif usage:** Only if editorial context demands it.
Distinctive modern serifs only (`Fraunces`, `Instrument Serif`).
Never in dashboards, settings, or any software-UI surface of
Coxinha.

**High-density numbers:** When showing metadata columns (meeting
durations, transcription times, file sizes), use JetBrains Mono
so digits align in tabular columns.

---

## 4. Component Stylings

### Buttons

- **Primary:** Coxinha Orange fill, Cream Paper text, 6px
  radius, 8px vertical padding, 16px horizontal. On active
  press: 1px `translateY(1px)` — tactile push. No outer glow,
  no gradient, no neon.
- **Secondary:** Transparent fill, Coffee Ink text, Whisper
  Line border (1px). On hover: Whisper Line fill. On active:
  same press tactic.
- **Destructive:** Alarm Red fill for confirm dialogs only;
  text style elsewhere with Alarm Red colour + underline on
  hover.
- **Ghost / icon button:** No border, no background. On hover,
  a subtle Whisper Line circular halo (radius matches the
  touch target). Never a tooltip that shows on first load —
  always on hover with 400ms delay.

### Cards

Used sparingly. Cards exist only when elevation communicates a
meaningful hierarchy step (share modal content, workspace
switcher popover). Inside the Notes list, tag cluster, and
Settings sections — use border-top dividers or negative space,
not cards.

When used: 8px radius (not the AI-typical 1rem+), Whisper Line
border, soft Cream Paper fill on Cream Paper background (subtle
contrast), no drop shadow. A card with a heavy shadow reads as a
modal — we don't use cards for decorative lift.

### Inputs

Label above input, error below. Focus ring is 2px Coxinha Orange
with 2px offset (the ring is outside the border, not inset). No
floating labels (they lose the label when the field is filled).
Placeholder text in Steel Grey at regular weight.

Search input in the sidebar is the single exception: icon-left,
no label (the placeholder + magnifier is enough), pill shape
(radius matches vertical padding), Linen fill.

### Loading states

Skeletons match the exact layout dimensions of the content they
replace. Skeleton colour is Whisper Line with a 2s shimmer
animation using Cream Paper as the highlight. **Never** a
circular spinner — they lie about progress.

### Empty states

Each primary route has a composed empty state:

- **`/notes` (no selection):** The editor itself — per spec
  0042. Full-bleed. Cursor at top-left. No CTA, no illustration.
  BlockNote's own placeholder ("Enter text or type '/' for
  commands") is hidden here because it competes with the
  writing surface.
- **`/agenda` (no daily note yet):** A line-drawn SVG of an
  open notebook with today's date spelled out by hand above
  it. Beneath: "Start today" button that creates the daily
  note.
- **`/meetings` (empty):** A line-drawn SVG of a small
  microphone on a book. Beneath: "Use Win+Shift+R to record
  when a call starts." No button; the copy shows the hotkey
  itself as a teacher.
- **`/settings`:** No empty state — always has content.

SVG illustrations are monochromatic Coffee Ink line art (1.5px
stroke), small (max 96px wide), positioned high in the empty
pane. Never a 3D render, never stock illustration, never a
gradient.

### Kbd keys

Wherever a shortcut is surfaced in UI (tooltips, empty-state
copy, settings):

```
<kbd class="font-mono text-xs px-1.5 py-0.5 rounded border
            border-[var(--whisper-line)] bg-[var(--linen)]
            text-[var(--coffee-ink)]">
  Win+Y
</kbd>
```

### Tag pills

Not rounded-full (that reads as a notification badge). 4px
radius. Hashtag symbol inline, count in JetBrains Mono at 50%
opacity after the tag name. Active pill: Coxinha Orange fill,
Cream Paper text. Inactive: 1px Whisper Line border, transparent
fill, Coffee Ink text, hover darkens background to Linen.

---

## 5. Layout Principles

- **App container:** max-width 1400px, centered. Equal margins
  on wide viewports; the chrome never crosses the outer 32px.
- **Sidebar:** fixed 280px wide. Not collapsible on hover (too
  disorienting). A future setting may allow manual collapse —
  not default.
- **Main pane:** reading column max-width 720px, centered
  inside the main area. On viewports wider than 1200px, the
  negative space to the right of the reading column stays
  empty — it does *not* fill with a secondary panel except
  when there is content-worthy reason (BacklinksPanel on an
  opened note, 256px).
- **CSS Grid over Flexbox math.** Never `calc()` percentage
  hacks for layout proportions. Grid area names over magic
  numbers.
- **Full-height sections:** `min-height: 100dvh` — never
  `h-screen` or `100vh`.
- **No overlapping elements.** Every element occupies a clean
  spatial zone. Exception: `<kbd>` inline inside text (that's
  not overlap; it's flow). No absolute-positioned decorative
  layers stacking.

### Responsive

Coxinha F1 is a desktop tray-resident tool. Mobile is out of
scope. But the layout still respects container queries so the
window can be narrowed to 800px without breaking:

- Below 1200px: reading column still 720px max, but negative
  space shrinks and finally the reading column itself begins
  to compress at 900px window width.
- Below 768px: sidebar collapses to 64px icon-rail; the panels
  (search, recents, tags) slide into a scrim that opens on
  click. This is future scope (F2 web UI per spec 0022).

---

## 6. Motion & Interaction

Spring physics only. Linear easing is banned.

| Surface | Behaviour |
|---|---|
| **Note list swap-in** | Spring `stiffness: 200, damping: 25` — the new note slides in from above existing ones. No stagger on a single item. |
| **Route transition** | None. We're not a consumer app with page-turn delight; navigation is instant. |
| **Active nav highlight** | 150ms `ease-out` on background and colour. No transform. |
| **Draft → persisted transition** | 400ms `ease-out` on the main pane background colour — Cream Paper → Linen — so the user feels the moment the note becomes a real file. |
| **Save complete indicator** | 600ms fade in/out of a tiny Coxinha Orange dot at the sidebar brand line. Never text ("Saved!"). Never a toast. |
| **Focus ring** | No animation — appears instantly, sharp. |
| **BlockNote slash menu** | Fade + 4px `translateY` on appear; 150ms. Not 200, not 100. |
| **Empty-state SVG illustrations** | A very slow, breathing opacity loop — 0.92 → 1.0 → 0.92 over 6 seconds. The only perpetual motion in the app. |

Animate `transform` and `opacity` only. Never `width`, `height`,
`top`, `left`. CPU-heavy animation lives in isolated components.

---

## 7. Anti-Patterns (Banned)

General AI tells:

- **Inter**, generic system-sans for premium contexts.
- **Generic serifs** (Times New Roman, Georgia, Garamond) in
  any UI surface.
- **Pure black** (`#000000`).
- **Purple/blue neon gradient** aesthetic.
- **Oversaturated accents** (>80% saturation).
- **Outer-glow shadows** on buttons or cards.
- **Custom mouse cursors.**
- **Emojis** in UI copy. (User-authored note content is
  user-authored — this applies to UI chrome only.)
- **3-column equal card layouts** for feature rows.
- **Fabricated metrics** — "127 notes indexed", "99.9% sync
  reliability", "Average save time 45ms". If a metric isn't
  real, the placeholder is `[metric]` or omitted.
- **`LABEL // YEAR`** typography ("COXINHA // 2026") — lazy
  AI design cliché, not real typographic practice.
- **"Elevate", "Seamless", "Unleash", "Next-Gen"** copy.
- **Scroll arrows, bouncing chevrons, "Scroll to explore"**
  filler.
- **Broken Unsplash links** or stock photo placeholders.
- **Centered heros** on high-variance projects (we qualify).
- **Generic placeholder names** ("John Doe", "Acme Corp",
  "Nexus Labs").

Coxinha-specific bans:

- **Page icons / per-note emojis** Notion-style. Our files are
  plain Markdown (ADR-0002). A note doesn't have an icon; it
  has a title.
- **Template gallery** on the empty state. Empty state is the
  editor (spec 0042). Not a modal, not a "choose a template"
  wall.
- **Floating action button** ("+" in the bottom-right corner).
  The hero shortcut is Win+Y, the sidebar has a "+ New"
  button, and the route `/notes` is a full editor. An FAB would
  be redundant and mobile-shaped.
- **Sidebar collapse-on-hover.** Width is fixed at 280px.
- **Database / kanban / calendar-as-table views.** Different
  product. Coxinha is a notetaker + recorder.
- **Onboarding modal / welcome tour.** The Getting Started
  content lives in the default `daily/YYYY-MM-DD.md` template
  on first run — in the vault, editable, part of the corpus.
  Not a dismissible overlay.
- **Save notifications / toasts on every keystroke save.** The
  debounced 500ms save path is invisible by design. The only
  save indicator is the subtle dot pulse (see motion).

---

## 8. Signature Moves

Three things that mark a screen as "Coxinha" at a glance:

1. **Restraint-through-neutrality.** Zinc-family grays on
   every surface, Coxinha Orange only where action or system
   state demands it. A user can glance at the screen for a
   full second before seeing any colour — that silence is the
   signature. Arc Browser-adjacent, but with a distinct accent.
2. **Reading column with deliberate negative space on wide
   viewports.** Content has a max-width and respects it —
   the pane doesn't fill edge-to-edge on a 1920px monitor.
   Notion and Google Docs do fill; we don't.
3. **Hand-drawn SVG illustrations** for Agenda / Meetings
   empty states. Not 3D renders, not stock illustration, not
   Lottie. 1.5px line art in Ink, breathing slowly. This is
   where "craft" personality shows up concretely without
   fighting the neutral surfaces.

---

## 9. How this doc is used

- **Pencil CLI prompts** quote the atmosphere and palette
  sections verbatim when generating a `.pen` file.
- **`polish` skill** reads section 4 when doing a quality pass.
- **`emil-design-eng` skill** reads section 6 for motion
  direction.
- **`impeccable` skill** in `craft` mode reads the whole doc
  as design context.
- **Human review:** when a mockup looks "off", diff it against
  the relevant section here — the doc is the arbiter.
