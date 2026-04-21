# Spec 0040: Shared links for notes and diagrams

- **Status:** draft
- **Phase:** F3 (after sync F2 is live)
- **Owner:** Rodolfo
- **Depends on:** spec 0019 (backend), spec 0020 (sync client),
  spec 0022 (web UI), spec 0023 (auth)
- **Relevant ADRs:** ADR-0002, ADR-0015, ADR-0016, ADR-0017
- **Layer:** Outputs (read/edit surface over existing Knowledge)

## Why

The user wants to paste a link and hand a note, a diagram, or
a meeting summary to someone on the team — the way Excalidraw
Cloud, Google Docs, or Notion publish work. Spec 0022 gives the
owner a personal web mirror; it does **not** let a non-owner open
a single resource without credentials. That is the gap.

ADR-0016 already made every view URL-addressable. This spec picks
up from there: add a second kind of URL, `/shared/$token`, which
binds to a server-mediated permission overlay on top of a
sync'd resource (spec 0019 + 0020).

## Scope

### In

- Shared resource types (first iteration):
  - Notes (`notes/*.md` and `daily/*.md`)
  - Excalidraw diagrams (`attachments/*.excalidraw.json`)
  - Meeting summaries (`meetings/<id>/summary.md`)
  - Mermaid / inline blocks are shared *transitively* when the
    containing note is shared (no separate shareable resource)
- Token-based URLs: `coxinha://shared/$token` (desktop) and
  `https://<host>/shared/$token` (web). Same path segment; only
  the origin differs.
- Permissions baked into the token: `view`, `comment`, `edit`.
  Backend resolves token → `(resource_type, resource_id, perm)`.
- Share lifecycle: create, list (per owner), revoke, expire.
  Revocation returns `403`; deletion of the underlying resource
  returns `410 Gone`.
- Server endpoints (extend spec 0019):
  - `POST /shares` — body: `{ resource_type, resource_id, perm,
    expires_at? }`; returns `{ token, url }`
  - `GET /shares` — owner's active shares
  - `DELETE /shares/:id` — revoke
  - `GET /shared/:token` — open (auth-aware: returns metadata the
    recipient needs to render, not the raw vault file)
- Client UI: "Share" action in the editor toolbar for each
  supported type. Modal shows existing shares, permission
  selector, copy-link button. Recipient UI is a route under the
  tree that ADR-0016 establishes (`/shared/$token`), using the
  same editor component in `view` or `edit` mode.
- Unshared-but-referenced: when a shared note contains a wiki-link
  to an unshared note, the link renders as plain text with a
  tooltip "Not shared." No follow-through, no leak.
- Attachments inside a shared note (images, Excalidraw scenes the
  note embeds) are served via signed short-TTL URLs scoped to the
  same token — they do **not** become independently shareable.

### Out

- Comments, presence cursors, awareness. Excalidraw's native
  multiplayer is tempting but its own scope — spec 0041 territory.
- Team / workspace primitive ("share with everyone in Marketing").
  First iteration is per-link; team membership is a future spec
  once spec 0023 lands with user identity.
- Anonymous edit. First iteration caps anonymous access at `view`;
  `edit` and `comment` require a logged-in recipient. Rationale
  in design notes.
- Public discovery / search engines. All share URLs carry
  `X-Robots-Tag: noindex` and a random 128-bit token segment;
  there is no "public gallery" concept.
- End-to-end encryption of shared content. See open questions.
- Quota / billing for hosted server. Self-hosted only in F3; SaaS
  decision is separate.

## Behavior (acceptance)

1. **Create and open (view-only).** Owner clicks Share on a note,
   picks `view`, copies link. Pasting the link into the web build
   on another device renders the note read-only. No login prompt.
2. **Edit permission.** Owner sets `edit` on a shared note. A
   logged-in recipient opens the link; the editor loads with a
   banner "Shared by <owner>, edit enabled" and saves round-trip
   to the server. Owner sees the edit appear through the normal
   sync pipe (spec 0020).
3. **Excalidraw view.** Owner shares a diagram. Recipient opens
   the link; canvas renders the last-synced scene, read-only.
   Multiplayer interaction is out of scope (spec 0041).
4. **Revoke.** Owner clicks Revoke in the share list. An already-
   open recipient session stops accepting saves and the next
   navigation returns `403`. The resource itself is untouched.
5. **Delete underlying resource.** Owner deletes a shared note.
   Token returns `410 Gone`. Owner's share list shows the entry
   as "dangling" for 7 days, then auto-prunes.
6. **Link safety.** Opening `/shared/$token` in a third-party
   browser does not leak the owner's session cookie (new scope)
   and does not grant any access beyond the token's permission.
7. **Offline owner, online recipient.** Recipient can still open
   the last-synced version; owner's subsequent offline edits
   appear only after they reconnect and sync.
8. **Deep-link inside a shared note.** A wiki-link inside a
   shared note to a non-shared note renders as inactive text.
   No 404-to-owner-vault leak.
9. **Desktop app opens shared URL.** `coxinha://shared/$token`
   lands on the same route component as web; the route detects
   it was not the owner and mounts the recipient shell.

## Design notes

- **Share is a permission overlay, not a new storage.** The
  shared resource already exists in the backend via spec 0020
  sync. A share row is `{ id, token, owner_id, resource_type,
  resource_id, perm, created_at, expires_at? }`. This keeps the
  canonical model intact: the owner's filesystem is still the
  truth (ADR-0002), the server is an authoritative replica
  (spec 0019), and a share is metadata.
- **Recipient editor is the same component, different route.**
  Per ADR-0016, `/notes/$id` shows your own note;
  `/shared/$token` shows a token-mediated one. Same BlockNote /
  Excalidraw component; different data source (API endpoint vs
  local sync). Shared vs owned never has to be a conditional
  inside the editor.
- **Token shape.** 128 bits of URL-safe random + a 4-char prefix
  encoding resource_type (`n_`, `x_`, `m_`). Prefix is for UX
  (copy-paste smell test), not security. Security rides entirely
  on the random segment + HTTPS.
- **Anonymous cap on view only.** Anonymous edits would require
  identity fallback (nickname? IP? client-generated UUID?) which
  leaks to the owner's audit log with nothing to tie to. Cheap
  rule: anonymous = read-only. The product feel matches
  Excalidraw Cloud (you can see, not scribble, without an
  account).
- **Where the share list lives.** Server-authoritative. Client
  caches recent entries in `.coxinha/shares-cache.json`
  (rebuildable, not canonical) so the Share menu renders
  instantly on a cold boot before the `GET /shares` round-trip
  completes.
- **Transitive attachment serving.** `GET /shared/:token/blob/:id`
  returns an attachment referenced by the shared resource,
  provided the resource embeds it. Signed URL, short TTL. No
  top-level `/attachments/:id` exposure.
- **Naming the route.** `/shared/$token` (not `/s/$token` or
  `/share/$token`) — matches the backend `/shared/:token`
  endpoint and reads naturally in the URL bar.
- **Backpressure on edit shares.** When the recipient is editing
  through a share, their changes pipe through the same sync
  (spec 0020) as the owner's. Conflict resolution is spec 0021's
  job (Yjs for rich text; simple LWW for metadata). No new
  CRDT design this spec.
- **Workspace membership is the default share scope (ADR-0017).**
  Every resource lives in a workspace. Workspace members inherit
  role-based permission once spec 0023 defines roles; per-link
  shares via this spec are *overrides* — typically to grant
  access to non-members, or to tighten a workspace role (e.g.,
  a `view` link on a workspace where the member has `edit`). The
  token binds to `(resource_type, resource_id)` only, so a
  recipient never needs workspace membership to open a share
  link. When a resource moves between workspaces, existing
  tokens keep working; workspace-derived permission is
  re-evaluated from the new parent.

## Open questions

- **E2E encryption.** Would prevent server-side search on shared
  content (acceptable — shared resources are small by
  definition) and break server-side preview rendering. Worth an
  ADR before F3 — likely ADR-0017. Recommend: off by default in
  first iteration, opt-in per share later.
- **Password-protected links.** Trivial to add to the token
  grant, high value for users sharing outside their org. Scope
  creep here — punt unless trivial.
- **Expiry defaults.** None (persistent) vs 30 days vs 7 days.
  Lean toward "user-picked, defaults to never, UI shows stale
  links prominently in the share list."
- **Share audit log.** Owner's log of who opened a share (user id
  for authenticated, IP hash for anonymous). Privacy trade-off —
  probably off by default, opt-in later.
- **Should Mermaid / code blocks get independent share URLs?**
  Argument for: easy embed in other Markdown apps. Argument
  against: they're always part of a note — share the note. Lean
  against for F3.
- **Cross-workspace sharing** (once workspaces exist) — out of
  scope; revisit after workspaces spec exists.

## Follow-up specs

- **Future spec** — Realtime multiplayer on shared Excalidraw +
  BlockNote: presence cursors, awareness, live co-editing.
  Depends on spec 0040 + spec 0021.
- **Future spec** — Comments and threads on shared resources.
  Depends on spec 0040.
- **Future ADR** — E2E encryption policy for shared content.
  Blocks the "opt-in E2E" bullet above.
- **Backfill for existing specs:**
  - Spec 0022 (web UI) gains a note: anonymous `/shared/*` route
    is allowed even when the rest of the web UI requires auth.
  - Spec 0023 (auth) gains a token-scope for shared-link
    recipients (distinct from owner session tokens).

(The earlier draft of this spec reserved numbers 0041/0042 and
ADR-0017 for the three follow-ups above. Those numbers have
since been taken by unrelated work — spec 0041 is workspaces,
spec 0042 is UX polish, ADR-0017 is workspaces + resource
taxonomy. The follow-ups keep their concepts but not their
reserved numbers; they will be assigned the next available
integers at author time.)
