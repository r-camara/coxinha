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

## 2026-04-19 — `include_bytes!` inputs must not be globally gitignored

**Context:** Adding `cargo clippy` to CI exploded in three rounds:
first glib wasn't installed, then alsa, then `silero_vad.onnx` was
missing. The onnx file was blocked by the project-wide
`*.onnx` gitignore rule. Locally the file existed because it had
been copied in during the Handy port; every fresh clone would
have failed identically.

**Lesson:** any file read at compile time (`include_bytes!`,
`include_str!`, build-script inputs) is part of the source tree,
not runtime data — the gitignore must exempt it explicitly. The
fix is `!path/to/file` **plus** committing the file. A zero-
byte placeholder won't do: the compile-time read needs the real
bytes.

Broader rule: when `.gitignore` uses a glob (`*.onnx`, `*.bin`,
`*.pdf`), scan the tree for anything matching that must *not*
be ignored and add explicit negations. Grep for the extension
inside `include_bytes!`, `include_str!`, `std::include_bytes!`,
and build-script `cargo:rerun-if-changed=` directives to find
them.

**Reference:** PR #10 `ci(0001)` + follow-up commit `fix(vad):
commit bundled silero_vad.onnx`.

---

## 2026-04-19 — `useEffect` on a frequently-churning array reference

**Context:** Zustand's `saveNote` action rebuilds the `notes` array
on every keystroke-debounced save (via `sortByUpdated([...])`),
so `useEffect(() => { fetchBackend() }, [notes])` re-fires on
every edit — even when nothing the effect cares about actually
changed. Found during PR #8 simplify pass on the sidebar tag
cloud: typing in a note body round-tripped `listTags()` to SQLite
per save-tick.

**Lesson:** when the dep is a store array whose identity is
cheaper to invalidate than its content, derive a cheap signature
from the properties the effect actually uses and use that as the
dep instead. For the tags effect:

```ts
const tagSignature = useMemo(
  () => notes.map((n) => `${n.id}:${[...n.tags].sort().join(',')}`).join('|'),
  [notes],
);
useEffect(() => { ... }, [tagSignature]);
```

Costs O(N·tags) in string work per render but trades that for
avoiding an IPC round-trip on every save. Same trick applies to
any component that watches `notes` but only cares about a subset
(backlinks, tag cloud, outline).

**Reference:** PR #8 refactor commit `refactor(0014): simplify
pass on tags filter`.

---

## 2026-04-19 — Wipe-before-populate needs per-item error resilience

**Context:** `rebuild_from_vault` v1 did `clear_all_note_data` →
walk → re-upsert in a loop with `?` on every step. A single
unreadable `.md` (invalid UTF-8, locked file, directory named
`.md`) propagated its error through the walk, leaving the user
with a freshly-wiped, half-empty index until they hand-fixed the
offender.

**Lesson:** any operation shaped as *delete-the-truth-then-rebuild*
— rebuild_from_vault, migration backfills, cache warmers — must
wrap per-item work in a scope that catches, logs, counts, and
continues. Abort-on-first-error leaves the system worse than
before the operation started. Return a stats record with a
`skipped` count so the UI can surface partial success without
pretending everything worked. Tests: feed a corrupt item and
assert `indexed < input_count`, not just "didn't panic".

**Reference:** PR #7 `fix(0005): resilient rebuild + symlink skip`,
diff against PR #6 for the before/after.

---

## 2026-04-19 — Multi-angle simplify review finds disjoint bugs

**Context:** the three review agents (reuse, quality, efficiency)
were used as a single "simplify" pass. Early intuition said two
of them would overlap heavily; the 2026-04-19 passes (wiki-links
PR #5 + rebuild PR #6 follow-up) disproved it:
- Efficiency agent caught the **React timer leak** in
  `NoteEditor.debouncedSave` (closure-captured setTimeout, no
  unmount cleanup). Neither quality nor reuse agent surfaced it.
- Quality agent caught the **per-file error abort** in
  `rebuild_from_vault` that leaves the user with a wiped index.
  Efficiency agent (who should have seen it as a robustness
  issue) missed it both times.
- Reuse agent correctly pointed to a `useAsync<T>` extraction
  opportunity the other two ignored as "fine because it compiles".

**Lesson:** don't collapse the three angles into one prompt. The
roles are different mental models (is this code wasteful? is it
hacky? is it reinventing something?) and the categories of bug
each one spots rarely overlap. Running all three in parallel
costs ~3 min of wall-clock agent time and ~3 KB of context; skip
at your peril.

**Reference:** simplify passes 2026-04-19 (PRs #5, #6, #7).

---

## 2026-04-18 — Postmortem: the four boot failures that unit tests missed

**Context:** in one afternoon of real integration the skeleton
hit four distinct boot failures that the existing unit suite
couldn't have caught. Each one lived in plugin config, feature
flags, or runtime setup — none of it in pure functions:

1. `tauri.conf.json` declared `plugins.autostart: { args: [...] }`
   while the v2 plugin expects `null` — deserialization panic on
   `generate_context!()`. Fix: remove the key (the Rust `init()`
   already passes args).
2. `src-tauri/Cargo.toml` had `default = ["stt-whisper"]`, which
   pulls `whisper-rs-sys`, which runs `bindgen` at build time and
   needs `libclang` on the host. Fresh Windows devs with no LLVM
   installed couldn't even `cargo check`. Fix: `default = []`,
   engines opt-in via `stt-*` features or the `full-release`
   bundle.
3. After (2) landed, a stale `config.toml` from the previous
   failed boot pointed at `engine = "whisper"`, so the setup hook
   panicked with "stt-whisper feature not enabled". Fix: added
   `TranscriberConfig::None` (new default) + a resilient factory
   that falls back to a `NoopTranscriber` with a warning instead
   of failing app startup.
4. `tauri.conf.json` had an `app.trayIcon` block AND
   `tray::setup` built another one — two tray icons in the tray
   for the same process. Fix: keep the programmatic one (needs
   `on_menu_event` + `on_tray_icon_event` handlers the JSON path
   can't express), drop the JSON block.

**Lesson:** a pure-function test suite (storage, db, helpers)
gives false confidence against regressions in **plugin config,
feature-gated builds, persisted-config compatibility, and runtime
setup hooks**. Add a boot smoke test that actually spawns the
binary and waits for the `Coxinha ready` marker **before** any
other feature lands. Any of the four failures above would have
been caught on the first run. Budget: ~800 ms boot-to-ready today;
perf smoke enforces < 5 s so a regression is loud.

**Reference:** `src-tauri/tests/boot_smoke.rs`,
`src-tauri/tests/perf_smoke.rs`, spec 0002 (testing baseline).

---

## 2026-04-18 — `ort` v2-rc needs the `std` feature for anyhow

**Context:** adding `ort = "2.0.0-rc.10"` with
`default-features = false` to save binary size led to a cascade
of `?`-conversion errors: `ort::Error: StdError is not
satisfied`. `ort` gates `impl std::error::Error for Error` behind
a `std` feature that the default set enables — stripping it
removes the trait impl, and `anyhow::Error: From<E>` stops
accepting it.

**Lesson:** when dropping `default-features = false` on a crate,
re-enable `std` explicitly (`features = ["std", ...]`) unless
the crate is genuinely `no_std`-friendly and you're chasing that
target. The error message points at anyhow, not at the missing
feature — a five-second read of the crate's `Cargo.toml` feature
list is the fastest way to diagnose.

**Reference:** `src-tauri/Cargo.toml` — `ort` dep.

---

## 2026-04-18 — Review findings deferred (centralization + pagination)

Items flagged by the simplify pass on 2026-04-18 that we
consciously skipped for this PR and that **should not** be
re-raised as "found a bug" next session:

- **Stringly-typed route strings** (`/notes/new`, `/agenda`, etc.)
  duplicated between `src-tauri/src/shortcuts.rs` and
  `src/App.tsx` event listener. Centralizing via a shared const
  (specta-exported, Rust source of truth) is worth doing once we
  cross five routes or add a route inside the shortcut flow that
  doesn't match `App.tsx`. Today: 5 routes, 1 match per side.
- **`.map_err(|e| e.to_string())` in every IPC command**: 15
  occurrences, intentionally kept as local idiom. A helper would
  save ~30 chars per command and centralize if we ever add
  structured error types. Revisit when we have a reason (e.g.,
  surfacing error codes to the UI for toasts).
- **`list_notes` returns everything**: fine up to ~10 k notes;
  revisit for F2 (sync) where latency compounds with network.
- **`call_detector` mutex lock every 3 s** regardless of change:
  flagged, not changed in this PR because the code path wasn't
  touched here. Add a cheap "prev set == new set" comparison
  outside the lock. Tracked in spec 0007 acceptance.
- **`Sidebar.tsx` nested `px-2`**: children (search input, h2
  headings) re-apply `px-2` under an already-padded parent. Looks
  consistent on-screen so the refactor is deferred until the
  visual regression test exists.

**Lesson:** record deferred findings in one place so a future
review doesn't re-propose the same change. Each entry needs
**why not now** and **the trigger that should make us reconsider**.

**Reference:** simplify pass 2026-04-18 transcripts.

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
