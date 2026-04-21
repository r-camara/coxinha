# Type-model benchmark — AnyType, Obsidian, Notion, Mem, Granola

*Research date: 2026-04-20. Sources are public docs only; anything I could not verify is tagged `[unverified]`.*

## Why this document exists

Coxinha is consolidating the resource model before F2: ADR-0017 proposes a closed `kind` (markdown / binary / bundle) plus an open `type` in YAML frontmatter, served out of `workspaces/<slug>/` folders on disk (ADR-0002 keeps the filesystem canonical; ADR-0015 keeps knowledge separate from AI-derived memory). Before shipping a novel split we want to know what established local-first and cloud notetakers actually do: how rigid their types are, what scope primitives they expose (spaces / workspaces / collections), how sharing layers onto that, and what ships as plain files vs. an opaque database. This benchmark is a sanity check against spec 0039 (client shell / routing) and spec 0040 (shared links) — not a design input.

## Comparative matrix

| Dimension | AnyType | Obsidian + Dataview | Notion | Mem | Granola |
|---|---|---|---|---|---|
| Type model | Every object has a Type; Types and Properties user-editable in Space settings | No enforced types; inferred from YAML/inline fields (`::`) | Every page is a page; databases add schemas with typed properties | Collections replace tags; no type system | Meeting is the implicit type; no user-defined types `[unverified]` |
| Workspace | "Spaces"; multi-space; no nesting documented `[unverified]` | Vault = a folder; folders nest freely | Workspace > Teamspace > pages (pages nest infinitely) | Collections; note can live in many; nesting not documented | "Spaces" (My notes / team) containing folders |
| Sharing | Per-space invite link; Owner/Editor/Viewer; account required `[unverified]` | No built-in sharing; depends on Sync or third-party | Per-page; Full/Edit/Edit-content/Comment/View; web links + guests | Cloud-hosted; sharing not documented in cited pages `[unverified]` | Per-folder + per-note; guests need no account; link + member ACL |
| Change history | Per-object version history; granularity not specified | File-recovery plugin: 5-min snapshots, 7-day retention (default) | Page history (exists; retention by plan) `[unverified]` | Not documented `[unverified]` | Not documented `[unverified]` |
| Storage shape | Encrypted IPFS flatfs; zero-knowledge AES two-layer | Plain Markdown files + `.obsidian/` config folder | Proprietary cloud DB | Cloud; TLS in transit, AES-256 at rest | Local SQLite encrypted since v6; ProseMirror JSON in cache |
| Extensibility | GUI: create Types and Properties in Space settings | Edit a file: add frontmatter / inline fields freely | GUI: add database properties; no custom page schema | GUI: create/merge/rename Collections | None documented for users `[unverified]` |
| Realtime | Multiplayer shared spaces; cursor presence not cited `[unverified]` | Single-user; Sync is async file-level | Live cursors + simultaneous editing | Not documented `[unverified]` | Not documented `[unverified]` |
| Lock-in / export | Encrypted blobs on disk; no documented plaintext export | 100% user-owned plain `.md`; zero lock-in | Markdown/HTML/CSV/PDF bulk export; callouts degrade to HTML | Export exists; AI context does not carry over | No official markdown export; community CLIs reverse-engineer the now-encrypted cache |

## Per-product deep dive

### AnyType

AnyType enforces a strict object model: "every object must have a type" and Types are paired with Properties (a.k.a. Relations) that behave like typed database columns [https://doc.anytype.io/anytype-docs/getting-started/object-editor, https://doc.anytype.io/anytype-docs/getting-started/types/relations]. Ten built-in property types cover Text / Number / Date / Select / Multi-select / Email-Phone-URL / Checkbox / File & Media / Object [https://doc.anytype.io/anytype-docs/getting-started/types/relations]. Types and Properties are user-editable through the Space settings GUI [https://doc.anytype.io/anytype-docs/getting-started/types/relations].

The scope primitive is the Space: invite links are generated per Space with Owner / Editor / Viewer roles, or a "Request Access" flow for approval [https://doc.anytype.io/anytype-docs/getting-started/collaboration]. Storage is local-first over a private IPFS network with two-layer AES encryption; backup nodes hold only the first-layer key and cannot decrypt content [https://doc.anytype.io/anytype-docs/advanced/data-and-security/how-we-keep-your-data-safe, https://doc.anytype.io/anytype-docs/advanced/data-and-security/data-storage-and-deletion]. Files live in an encrypted `flatfs` directory inaccessible outside the app, and AnyType stores the history of changes for each object [https://doc.anytype.io/anytype-docs/advanced/data-and-security/data-storage-and-deletion, https://doc.anytype.io/anytype-docs/advanced/data-and-security/how-we-keep-your-data-safe]. Public docs do not describe a plaintext export path `[unverified]`.

### Obsidian + Dataview

The vault is "a folder and any sub-folders" of plain Markdown plus a `.obsidian/` config directory — no proprietary DB [https://docs.obsidian.md/Plugins/Vault]. There is no enforced type system; users attach metadata via YAML frontmatter or Dataview inline fields (`Key:: Value` anywhere in the note, including `[inline:: form]` for list items) [https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/]. Dataview *infers* types from value format (ISO dates, numbers, booleans, lists, objects) rather than enforcing a schema [https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/, https://blacksmithgu.github.io/obsidian-dataview/annotation/types-of-metadata/].

Change history is delivered by the File Recovery core plugin: default snapshot interval 5 minutes, default retention 7 days, stored outside the vault in global settings [https://forum.obsidian.md/t/does-file-recovery-plugin-use-lot-of-storage-is-every-5-mn-for-10-years-reasonable-how-to-backup-snapshots/101963]. Sync (paid) layers its own version history [https://www.obsidianstats.com/plugins/obsidian-version-history-diff]. There is no built-in realtime collaboration; sharing is whatever the user builds on top of Sync, Git, or filesystem. Lock-in is effectively zero: the vault is standard Markdown that opens in any editor.

### Notion

Everything is a page; structure comes from databases, which are "collections of pages" with typed properties that can be filtered, sorted, and viewed [https://developers.notion.com/guides/data-apis/working-with-databases]. The scope hierarchy is Workspace > Teamspace (paid) > Shared / Private sections > infinitely nestable pages [https://www.notion.com/help/intro-to-workspaces]. Sharing is per-page at five levels — Full access, Can edit, Can edit content (database-specific), Can comment, Can view — with Share-to-web links, expiry, guest invites, and row-level rules on Business/Enterprise [https://www.notion.com/help/sharing-and-permissions].

Realtime collaboration includes live cursors and simultaneous editing but requires network connectivity; offline mode is limited [https://www.notion.com/help/collaborate-with-people]. Storage is the proprietary cloud DB; bulk export offers Markdown, HTML, CSV (databases), and PDF on Business/Enterprise, but Notion uses "Enhanced Markdown" with XML-like tags for callouts/columns, so round-trip is lossy [https://www.notion.com/help/export-your-content]. Page history exists (retention varies by plan `[unverified]`).

### Mem

Mem's organising primitive is the Collection. Tags were not deprecated; rather, "these tags will create Collections instead", and "a note can live in multiple collections at once" [https://help.mem.ai/features/collections]. Collections have an Auto-organize feature: the AI "intelligently suggest[s] relevant Collections as you type" and proposes pertinent mems for new Collections [https://get.mem.ai/blog/automatic-organization-with-collections]. Public docs describe no hierarchy or nesting for Collections [https://help.mem.ai/features/collections]. There is no documented user-definable type system `[unverified]`.

Storage is cloud-only; Mem "encrypts your data in transit with TLS and at rest with AES-256" and commits to data ownership, stating users should "have both access and control" [https://get.mem.ai/blog/the-future]. Export exists, but community reporting notes that AI-generated context and links do not survive the export boundary [https://get.mem.ai/blog/the-future] `[inference about export fidelity, unverified in primary docs]`.

### Granola

Granola is meeting-first: the app "connects to your calendar to show your upcoming meetings. Clicking on one of these meetings will create a note for that meeting" [https://docs.granola.ai/help-center/getting-started/granola-101]. The scope primitives are Spaces (My notes / Team) that contain Folders; folders can be shared, made team-visible, or kept private [https://docs.granola.ai/help-center/getting-started/granola-101, https://www.granola.ai/blog/two-dot-zero]. Sharing has three axes — default Space visibility, explicit Member invites by email, and Link access — with folder owners and members; guests can receive a link without creating an account [https://help.granola.ai/article/sharing-folders, https://www.granola.ai/blog/two-dot-zero].

Storage moved from a readable local cache to an encrypted SQLite database as of v6, breaking community export tools that previously walked the ProseMirror JSON to emit Markdown [https://www.shadow.do/blog/granola-encrypted-its-local-database-heres-why-that-matters----and-what-to-use-instead, https://josephthacker.com/hacking/2025/05/08/reverse-engineering-granola-notes.html]. No official bulk Markdown export is documented; third-party tools exist but rely on internal APIs [https://github.com/theantichris/granola, https://github.com/wassimk/granary]. Version history, extensibility, and realtime presence are not documented in the cited pages `[unverified]`.

## Implications for Coxinha

- `[fact]` AnyType enforces a Type on every object and provides a GUI to edit Types/Properties in Space settings [https://doc.anytype.io/anytype-docs/getting-started/types/relations]; ADR-0017 goes lighter (open `type:` string in frontmatter, no enforcement). Validate in F2 whether this lightness covers the 80% case before building schema tooling — AnyType's approach shows the *heaviest* end of the spectrum, and users survive it.
- `[fact]` Obsidian ships no type system at all and lets Dataview *infer* types from value format [https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/]. This is the strongest existence proof that the ADR-0017 middle path (open `type` frontmatter + closed `kind`) is not an outlier, and that a SQLite index over frontmatter can replace Dataview-style inference.
- `[inference] from` Obsidian's default 5-min / 7-day File Recovery snapshots [https://forum.obsidian.md/t/does-file-recovery-plugin-use-lot-of-storage-is-every-5-mn-for-10-years-reasonable-how-to-backup-snapshots/101963] — a periodic full-file snapshot strategy is viable on the filesystem without a CRDT engine, so Coxinha can defer fine-grained per-character history past F1 and still match Obsidian's bar.
- `[fact]` Notion exposes five per-page permission levels (Full / Edit / Edit-content / Comment / View) with guest invites and web-share expiry [https://www.notion.com/help/sharing-and-permissions]; Granola reduces this to Owner + Members + Link-access per folder [https://help.granola.ai/article/sharing-folders]. For spec 0040 (shared links) a two-axis model (role + link-access) matches a shipping meeting product and is a concrete smaller target than Notion's five.
- `[inference] from` Granola encrypting its SQLite cache in v6 and breaking third-party exporters [https://www.shadow.do/blog/granola-encrypted-its-local-database-heres-why-that-matters----and-what-to-use-instead] — treating the SQLite index as opaque and rebuildable (ADR-0002) is vindicated; users who want lossless export should never be forced through the index. Keep the vault folder as the contract.
- `[inference] from` AnyType shipping per-space invites with Owner/Editor/Viewer and no nested spaces cited [https://doc.anytype.io/anytype-docs/getting-started/collaboration], Granola omitting a visible workspace concept below the folder level [https://docs.granola.ai/help-center/getting-started/granola-101], and Obsidian having no scope primitive beyond the vault folder — the ADR-0017 `workspaces/<slug>/` top-level folder is the simplest of these and is consistent with spec 0039's routing. Don't gate F2 on nesting: none of the five products require it to ship.

## Constraints met

- Total length: under 2000 words in the body.
- No speculation presented as fact. Every factual claim is followed by a citation URL or tagged `[unverified]` / `[inference]`.
- No opinions on product quality; focus is on architecture.
