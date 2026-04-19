# Lessons

Informal log of things learned, traps avoided, and rules of thumb
worth writing down so we don't repeat them. Bullets or short
paragraphs — not prose.

## Conventions

- New entries go **at the top**
- Heading: `## YYYY-MM-DD — Short title`
- Optional fields: `**Context:**`, `**Lesson:**`, `**Reference:**`
- If an entry hardens into a permanent rule, promote it to
  `CLAUDE.md` or an ADR

---

## 2026-04-18 — Spec numbers are identity, not priority

**Context:** started with a "never renumber" rule and fixed spec
IDs in creation order. A few sessions later the order we'd ship
in was clearly different, so "phases" (F1.0 Foundation, F1.1
Critical path, F1.2 UI, F1.3 Polish) got layered on top of the
stable numbers — which itself turned into the new complaint
("abstração de ordem é ruim"). Ended up breaking the rule once
to renumber 36 specs in implementation order.

**Lesson:** while the spec catalog is young (<50 items, <1 week)
and has few external consumers, number-in-creation-order is cheap
but misleading. Break the renumber rule **once** early so the
number reflects sequence, then lock it. Stacking ordering
abstractions on top of an unordered numbering scheme compounds
forever; a single Python-pass reshuffle costs a day.

**Reference:** specs/README.md "Conventions" section now says
"numbers reflect implementation order".

---

## 2026-04-18 — Freeze contracts before parallel implementation

**Context:** the meeting pipeline touches recorder, transcriber,
diarizer, summarizer, storage, and DB. Individual specs existed
for each module, but there was no canonical schema for
`metadata.json` / `transcript.json` / `summary.md`, no state
machine, no fallback matrix — each module was being described
against different implicit assumptions.

**Lesson:** for any pipeline where multiple modules produce or
consume on-disk artifacts, write two architecture docs **before**
the first implementation PR: a schema contract per artifact
shape (with explicit versioning) and a state machine (with
transitions, retries, and crash-recovery). Without both, the
integration pass becomes a rewrite. Also forces the questions
that actually matter — "what's the canonical meeting-note link?",
"what happens when diarization fails but transcription works?"
— before code imposes answers.

**Reference:**
[`architecture/vault-schema.md`](./architecture/vault-schema.md) +
[`architecture/meeting-pipeline.md`](./architecture/meeting-pipeline.md).

---

## 2026-04-18 — Batch doc remaps need multi-form coverage

**Context:** renumbered 36 specs via `git mv` + a Python regex
substitution across 40 docs. The pattern `\bspec (\d{4})\b`
caught `spec 0001` but missed `specs 0005, 0009` (plural),
`spec 0024/0021` (slash), and left the second number alone in
`spec 0023, 0024` (the regex only consumed the first match on
a line). Spot-fixes took ~15 minutes of manual greps.

**Lesson:** when remapping identifiers across docs, the substitution
has to cover: singular (`spec NNNN`), plural list (`specs NNNN,
NNNN, NNNN`), slash-separated (`NNNN/NNNN`), and filename slugs
(`NNNN-slug.md`). Apply via a single-pass dict mapping rather
than sequential `sed`s so an already-substituted token can't be
re-substituted. After the automated pass, always grep for the
bare number forms to catch what the regex skipped.

---

## 2026-04-18 — Mutating IPC commands should return the updated entity

**Context:** `update_note` originally returned `Result<(), String>`.
The only way for the frontend to see the refreshed title and
`updated_at` was to call `list_notes` after every save. With
BlockNote's 500ms autosave, every keystroke triggered a full
`list_notes` IPC + re-render of the sidebar.

**Lesson:** an IPC command that changes state should return the
entity it just changed. Callers patch their local array instead of
re-pulling the whole list — one IPC call, no sidebar flicker,
works even for thousands of notes. Rule of thumb: if a command
updates data the caller already had, the response includes the new
version of that data.

**Reference:** spec 0005 (notes); fixed in the initial review pass.

---

## 2026-04-18 — A "lazy cache" that nobody reads is silently dead

**Context:** `WhisperTranscriber` and `ParakeetTranscriber` each
had a `ctx: Mutex<Option<...>>` field and an `ensure_loaded()`
method, but `transcribe_file` rebuilt the model from disk inside
`spawn_blocking` instead of using the cached one (even with a
comment admitting "reload to avoid tangling lifetimes with self").
Every transcription paid full cold-load cost; the cache field was
literally unread.

**Lesson:** when you introduce a lazy/cached resource, grep for
reads of that field before trusting the design. `Arc` the cached
value so it can be cloned into `spawn_blocking` cheaply. If the
field isn't referenced outside its setter, it's dead — either wire
it up or delete it.

**Reference:** reviewer findings on commit `b3c9e01`.

---

## 2026-04-18 — GitHub rejects pushes that expose a private email

**Context:** First `git push` to the repo failed with
`remote: error: GH007: Your push would publish a private email
address`. The local commit author was the account's private work
email; the GitHub account had "Block command line pushes that
expose my email" enabled.

**Lesson:** when pushing from a new machine, set `git config
user.email` to the account's `<numeric-id>+<username>@users.noreply.github.com`
(visible at GitHub Settings → Emails). Fix the last offending
commit with `git commit --amend --reset-author --no-edit` and
push. Cheaper than flipping the account-wide privacy toggle.

---

## 2026-04-18 — Tauri 2 + image + whisper-rs require rustc 1.88+

**Context:** `cargo check --workspace` bailed because `image@0.25`,
`whisper-rs-sys@0.15`, `darling@0.23`, `serde_with@3.18`, and
several `zbus`/`zvariant` crates all need rustc 1.88.0 or 1.87,
while the machine had 1.86.

**Lesson:** bootstrap Coxinha on a new machine with `rustup
update stable` before the first build. The workspace's dep graph
has a hard floor around rustc 1.87/1.88 and the error messages
from `cargo` are dense (tons of transitive crates listed) — it's
easy to chase the wrong crate. Pinning older versions is a losing
game; keep the toolchain current.

**Reference:** [`scripts/setup-wsl.md`](../scripts/setup-wsl.md).

---

## 2026-04-18 — Tauri `setup` runs inside the tokio runtime

**Context:** `shortcuts::register_all` tried to read
`Arc<Mutex<AppState>>` with `tauri::async_runtime::block_on` inside
`setup`. This panics because `setup` is already running on the
Tauri tokio runtime.

**Lesson:** never `block_on` inside `setup`. Pass the data you need
(e.g., `ShortcutsConfig`) before wrapping it in `Arc<Mutex>`, or
use `tauri::async_runtime::spawn` with a channel.

**Reference:** spec 0006 (app shell: tray + global shortcuts), bug listed in
[status.md](./status.md).

---

## 2026-04-18 — GitHub web upload corrupted a binary into null bytes

**Context:** `coxinha-skeleton.zip` (61581 bytes) was committed via
GitHub's web upload and arrived in the clone as 61581 bytes of
**pure `\0`** — no PK signature, no central directory.

**Lesson:** never trust a binary upload via the web UI without
checking its hash. Before re-uploading, confirm magic bytes
(`PK\x03\x04` for ZIP) and `Get-FileHash` on both ends. A better
alternative: set `.gitattributes` with `*.zip binary` and commit
with `git add` locally, or skip the zip entirely and commit files
directly.

---

## 2026-04-18 — WSL2: keep projects under `/home/`, never `/mnt/c/`

**Context:** I/O performance between WSL and a mounted Windows
filesystem (`/mnt/c/...`) is up to 10x slower than WSL's native
Linux filesystem (`/home/<user>/`).

**Lesson:** all Coxinha dev in WSL lives under `~/projects/` or
similar. Access those files from Windows via
`\\wsl$\Ubuntu\home\<user>\...` or open VS Code with
`code ~/projects/coxinha` (Remote - WSL extension).

**Reference:** [`scripts/setup-wsl.md`](../scripts/setup-wsl.md).

---

## Template

```md
## YYYY-MM-DD — Short title

**Context:** what happened, which bug/surprise/observation.

**Lesson:** the rule or heuristic you'll apply next time.

**Reference:** links to commit, spec, ADR, issue, external doc.
```
