# Spec 0047: Voice dictation in Quick Capture

- **Status:** draft
- **Phase:** F2 (depends on transcriber ready)
- **Owner:** Rodolfo
- **Depends on:** spec 0038 (embedded dictation), spec 0007
  (recorder), spec 0042 (Quick Capture window)
- **Relevant ADRs:** ADR-0014 (audio toolkit from Handy),
  ADR-0007 (tray-resident)
- **Layer:** Processing → Knowledge (transcribed text becomes
  the note body)

## Why

`Win+Y` drops the user into a 900×600 focused window with a
cursor. Sometimes the user wants to capture a thought but their
hands are busy (driving, cooking, on a call). Single-turn voice
capture closes that gap without needing to start a full meeting
recording.

No local-first notetaker does this well today. Obsidian's audio-
recorder plugin captures raw audio only. Notion's AI transcribes
but requires cloud. Coxinha already has the STT pipeline wired
(spec 0007/0008) — the Quick Capture window gives it a natural
single-user surface.

## Scope

### In

- **Mic button** in the Quick Capture window's tab bar,
  right-aligned (before the `+` new tab). Lucide `mic` icon,
  14 × 14. Tooltip: "Dictate (Ctrl+Shift+D)".
- **Hotkey:** `Ctrl+Shift+D` toggles dictation (only active when
  the Quick Capture window has focus). Not a global OS hotkey.
- **Dictation panel** slides down from the tab bar when active:
  - Live waveform strip (Silero-VAD-gated levels, 16 kHz mono)
  - Partial transcript as it streams (greyed text, updates
    every 300 ms)
  - Stop button + elapsed timer (mono)
- **Commit flow:** pressing Stop finalizes the transcript (runs
  last Whisper/Parakeet pass if streaming wasn't final),
  inserts the text at the cursor position in the editor, and
  collapses the dictation panel. Audio file is **not saved by
  default** — this is single-turn dictation, not a recording.
- **Optional save audio:** a checkbox in the dictation panel
  ("Keep audio") writes the raw WAV to the current draft's
  attachments when the user commits.
- **Language detection:** respects the transcriber config
  (`config.transcriber.engine`). If the user has Parakeet
  multilang, PT/EN auto-detects; if Whisper, uses the
  configured language.
- **Permissions:** first dictation prompts for mic access via
  OS (Windows media permissions). Denied = dictation panel
  shows "Microphone access required" with a link to Settings.
- **i18n:** all copy keyed.

### Out

- **Full meeting recording** via dictation (spec 0007 covers
  that). Dictation is explicitly single-turn: one thought,
  one commit.
- **Diarization** in dictation — single speaker by design.
- **Cloud STT fallback** — zero network (ADR-0002).
- **Dictation in the main shell** (outside Quick Capture) — a
  follow-up if users ask. For F2, the floating focused window
  is the only home for the mic button.
- **Custom commands** ("delete last sentence", "new paragraph")
  — punt to a later spec. First iteration is text-only.

## Behavior (acceptance)

1. **Mic icon renders** in Quick Capture tab bar only. Not
   present in full shell. Vitest snapshot.
2. **Hotkey toggles** dictation start/stop when Quick Capture
   is focused. Not active elsewhere.
3. **Panel slides down** with 200 ms spring when dictation
   starts; collapses same on stop.
4. **Live waveform animates** at ≥ 30 fps during dictation
   (audio-level RAF-driven).
5. **Partial transcript updates** at least every 400 ms. Greyed
   text until committed.
6. **Commit inserts text** at the editor cursor position,
   preserving any text typed before/after during dictation.
7. **Audio not persisted** by default. Integration test
   confirms no file written to attachments unless "Keep audio"
   was checked.
8. **Permission denied path** shows the expected error state
   without crashing the window.
9. **Budget:** commit-to-insert latency ≤ 400 ms after
   pressing Stop (the final STT pass runs on the buffered
   audio already).

## Design notes

- **Audio pipeline reuse:** the Silero VAD + WASAPI mic tap
  from spec 0007 are already ported. This spec adds a
  "single-turn mode" to the recorder state machine:
  start → streaming → stop → final pass → emit `dictation_done`
  event → text injected into editor.
- **Streaming partial output:** Whisper-rs supports
  real-time with the `transcribe-streaming` flag; Parakeet
  has a different streaming API. Abstract both behind the
  existing `Transcriber` trait, adding a
  `transcribe_streaming()` method.
- **Text injection:** the BlockNote editor exposes
  `insertInlineContent(text, position)`; we call it at the
  current selection range. Cursor remains after the
  inserted text.
- **Panel design:** expands FROM the tab bar (44 px tall when
  open, animated). Waveform is a CSS-only render — 40 bars
  with `scaleY` driven by the RMS value via RAF.
- **Save audio path:** when enabled, the WAV is saved to
  `workspaces/$ws/attachments/<uuid>-dictation.wav` and
  linked in the note's frontmatter (`audio: attachments/
  <uuid>-dictation.wav`). The note UI gains a small audio
  player widget (future inline block type).
- **Lucide icons:** `mic` for idle, `mic-off` when
  permission denied, `stop-circle` during recording.
- **I18n keys:**
  - `dictation.start`, `dictation.stop`
  - `dictation.keepAudio`
  - `dictation.permissionDenied`
  - `dictation.partialPlaceholder`

## Open questions

- **Default language** when neither config is set — fall
  back to `sys_locale::get_locale()` language code? Or
  prompt first time?
- **VAD-based auto-stop** — should 5 s of silence end
  dictation automatically? Obvious UX win, but some users
  pause mid-thought. Proposed: opt-in in Settings.
- **Keep-audio checkbox default** — off (lighter footprint)
  or on (safer audit trail)? Proposed: off. Users who want
  audit can opt in.
- **Windows mic permission API** — verify `windows-rs` has
  a way to request mic access without the raw Tauri shell
  prompt. Otherwise use Tauri's permission plugin.

## Test plan summary

- **Vitest**: mic button present, hotkey gated to QC
  window, panel animation states, text injection.
- **Rust**: streaming transcriber trait with a stub
  engine (Noop) that returns canned partial chunks.
- **Integration**: end-to-end dictation with a short test
  WAV file piped through the recorder → assert text
  appears in a test editor fixture.
- **Manual**: smoke test on a Windows 11 box with Whisper
  configured; verify permission prompt fires first time
  and doesn't re-prompt.
