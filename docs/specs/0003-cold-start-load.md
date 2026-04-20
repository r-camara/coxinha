# Spec 0003: Cold-start and load benchmarks

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0002 (testing baseline)
- **Relevant ADRs:** ADR-0007 (tray-resident)

## Why
Coxinha's whole pitch is "keyboard shortcut → typing in <50ms"
(default `Win+Shift+N` after spec 0042 — the pre-0042 default
`Ctrl+Alt+N` was intercepted by OneNote on Windows; a
transitional `Ctrl+Alt+Shift+N` also failed in the field,
likely because `config.toml` held stale values and the new
`Default` impl doesn't apply to existing installs without
migration). That promise only holds if we measure it. Same for
the vault at realistic sizes — a 10k-note user shouldn't feel
a lag that a 100-note user doesn't.

Without budgets in CI, the next innocent-looking feature commit
will quietly add 200ms to startup and nobody will notice until a
user complains.

## Scope

### In
- **Cold-start bench** — time from process spawn to "tray icon
  visible" and "`Ctrl+Alt+N` → editor focused"
  - Budget per ADR-0007: <80ms backend ready, <100ms end-to-end
- **Warm-start bench** — tray re-click on an already-running app
  - Budget: <50ms window visible + focused
- **List-notes bench** against generated vaults of 100, 1k, and
  10k notes
  - Budget: <200ms for `list_notes` + first paint
- **Search bench** (FTS5) on the same vault sizes
  - Budget: <50ms per query
- **Idle memory footprint**
  - Budget: <150MB RSS after 5 minutes idle
- CI reports numbers on every PR; a >20% regression vs the last
  green run fails the check

### Out
- Stress / chaos testing → F2+
- Transcription throughput benchmarks → owned by spec 0008
- Multi-window / multi-vault perf → not applicable to
  tray-resident single-window design

## Behavior (acceptance)
- `cargo bench --workspace` prints the five numbers above and
  exits 0 when all budgets hold
- Benchmark results post as a PR comment on GitHub
- A fixture generator (`tests/fixtures/generate_vault.rs`) creates
  reproducible 100 / 1k / 10k note vaults
- Running the 10k benchmark locally completes in <5 minutes on a
  mid-range machine

## Design notes
- `criterion` for microbenchmarks on the Rust side (`list_notes`,
  FTS5 `search_notes`)
- Custom harness for cold/warm start: spawns the release binary,
  measures via log-based timestamps at known anchors (tray created,
  window shown, editor focused)
- Memory: read `GetProcessMemoryInfo` on Windows, `/proc/<pid>/status`
  on Linux
- 5 samples + median per metric to dampen CI flakiness; report the
  median, not the mean

## Open questions
- Cold start on Windows includes WebView2 warm-up time that is
  outside our control. Measure the Rust-only timestamps separately
  (process spawn → `setup` complete) to isolate our regressions.
- Regression gate width — 20% is generous for CI noise but may
  miss smaller creeps. Revisit after a few weeks of data.

## Shipped so far

- **Boot-to-ready budget** asserted at 2 s in `boot_smoke.rs`
  (`BOOT_READY_BUDGET`, was 5 s). Current measured: **~1.44 s**.
- **Backend slice of the new-note flow** — integration test at
  `src-tauri/tests/perf_new_note.rs`. Budgets `create_note` and
  `get_note` at 50 ms each (p-max over 10 samples after warm-up).
  Current measured: **create avg 2.1 ms / max 2.85 ms**, **get
  avg 0.4 ms / max 0.59 ms**.
- **Frontend marks** for the same flow — `src/lib/perf.ts` exposes
  a `mark()` helper + `logNewNoteTrace()` that reports the
  breakdown (hotkey → create-invoked → note-created →
  editor-suspended → editor-ready) on every Ctrl+Alt+N when
  DevTools is open. Budget asserted in the console: 2 s total.
  `performance.mark` is cheap enough to leave on in production.

Still pending from this spec: `criterion` microbenchmarks,
warm-start bench, 10k-note list/search benches, PR-comment
regression gate, fixture generator.
