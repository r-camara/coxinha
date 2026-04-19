# Spec 0038: Embedded dictation (hold-to-talk STT anywhere)

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** spec 0007 (recording pipeline), ADR-0008 (STT
  trait), spec 0010 (Settings)
- **Relevant ADRs:** ADR-0014 (audio toolkit from Handy)

## Why
Coxinha already plans mic capture + meeting transcription for
spec 0007. The same machinery, with a second global shortcut and
a small "type text into the active window" layer, gives users a
dictation tool that works in any text field on the OS — not just
in Coxinha's editor. That's the Handy use case, and it's more
valuable to Coxinha's users than staying meeting-only: they get a
note-taking vault, meeting capture, AND system-wide dictation
from one install.

This spec defines *that* feature end-to-end.

## Scope

### In
- **Hold-to-talk shortcut** (default `Ctrl+Alt+Space`, rebindable
  in Settings): while held, mic audio is captured; on release,
  the accumulated audio goes through the configured
  `Transcriber`, and the result is inserted at the current caret
  of whatever window has focus.
- **Toggle shortcut** (default `Ctrl+Shift+Space`, rebindable):
  first press starts a dictation session, second press ends it.
  Same output path.
- **Insertion strategy** (configurable in Settings):
  - `paste` (default): copy the transcript onto the clipboard,
    send `Ctrl+V` via a synthetic key event, restore the
    previous clipboard contents ~500 ms later.
  - `type`: simulate keystrokes directly (e.g. via `enigo`)
    for apps that strip pasted content.
  - `clipboard-only`: copy to clipboard, do not auto-paste — for
    users who want to paste manually or who run
    focus-sensitive apps.
- **Minimum utterance length**: < 300 ms of hold → treat as an
  accidental tap, discard without transcribing. Avoids
  `"."`-only outputs that were a common Handy complaint.
- **Tray + overlay feedback**:
  - Tray icon swaps to a "listening" glyph while recording.
  - Small non-focus-stealing overlay near the active caret
    (reuses the spectrum visualization from the audio toolkit)
    shows level + elapsed time; hides on release.
- **Settings tab "Dictation"**:
  - Toggle feature on/off.
  - Rebind hold-to-talk + toggle shortcuts (reuses the capture
    control from spec 0010).
  - Pick insertion strategy.
  - Pick transcription engine per-feature: dictation may want a
    faster engine (Parakeet) while meetings use a slower but
    better one (Whisper).
  - "Test dictation" button: triggers the same pipeline and shows
    the raw transcript in a text area without auto-pasting, so
    users can validate without messing up their current window.

### Out
- **LLM-based text cleanup / post-processing** on the dictation
  transcript → separate spec, tracked after 0038 lands. Prompt
  injection risk (Handy #1261) needs its own design.
- **Custom word replacements** (e.g. map spoken "grpc" →
  `gRPC`) → follow-up.
- **Translation** — pick source language, output English. Not for
  F1.5; reuses the same pipeline with a flag when it lands.
- **Dictation in Coxinha's own editor** — that's a regular input
  box, and the same shortcut works inside it via the same paste
  path. No special integration needed.
- **Voice commands** ("new note", "bold this") — out.

## Behavior (acceptance)
- **Happy path:** cursor parked in a Notepad window, hold
  `Ctrl+Alt+Space`, speak "hello world", release → "hello world"
  appears at the caret, previous clipboard content is restored
  within a second.
- **Toggle mode:** press `Ctrl+Shift+Space`, speak, press again
  → transcript lands at caret.
- **Brief tap:** press-and-release under 300 ms → no paste, no
  clipboard change, no error toast.
- **Focus-less hold:** no window has text focus (desktop is
  focused) → transcript goes to clipboard; toast explains "text
  field not focused, copied to clipboard".
- **Clipboard preservation:** whatever was on the clipboard
  before the dictation is restored on completion, even if the
  paste synthesis failed.
- **Engine failure:** transcriber returns error → toast with the
  error message; no silent black hole.
- **Overlap with meeting recording:** attempting to start
  dictation while `Recorder::is_recording()` returns true → the
  hold-to-talk gesture is ignored with a toast ("meeting
  recording in progress"); no concurrent mic contention.
- **Permission revocation** (Handy #1281): OS revokes mic
  permission mid-session → the next session fails cleanly with a
  toast that links to the OS permission panel. App must not
  freeze.
- **Hotkey conflict:** attempting to rebind to a combo another
  app owns surfaces the error in Settings per spec 0010.

## Design notes
- New Rust module `src-tauri/src/dictation.rs` owns the session
  lifecycle (idle → listening → transcribing → inserting →
  idle). Reuses:
  - `audio_toolkit::recorder` for the always-on input stream
    (spec 0007 addendum).
  - `Transcriber` trait (ADR-0008) for the STT step.
  - `tauri_plugin_global_shortcut` for registration; press /
    release events come from `ShortcutEvent::state()`.
- New IPC:
  - `start_dictation(mode: "hold" | "toggle") -> ()`
  - `stop_dictation() -> DictationResult` (returns transcript +
    elapsed + audio duration so the frontend's Test Dictation
    can render it)
- New events:
  - `dictation-started`
  - `dictation-level` (RMS, throttled to 10 Hz)
  - `dictation-finished` (transcript, duration, inserted: bool)
- Shortcut routing: the existing `shortcuts::handle_shortcut`
  grows a `dictation/hold` and `dictation/toggle` branch. Hold
  uses both `ShortcutState::Pressed` and `Released` — the rest
  of our shortcuts only fire on press.
- Paste synthesis on Windows: use the `windows` crate's
  `SendInput` via a thin helper. `enigo` is an option but adds a
  big transitive surface; prefer a 50-line direct SendInput
  wrapper.
- Clipboard access: Tauri `clipboard-manager` plugin (already
  part of the Tauri 2 SDK — add to plugins list in `lib.rs`).
- Configuration type: extend `shared::ShortcutsConfig` with
  `dictation_hold` + `dictation_toggle`; extend `AppConfig` with
  a new `DictationConfig { enabled, insertion, engine_override
  }`.
- Tests (per spec 0002):
  - Pure: `dictation::session::discard_if_shorter_than(300ms)`.
  - Integration: feed a canned WAV through a `MockTranscriber`
    and assert the transcript reaches the paste helper (the
    paste helper itself stays behind a trait so the test swaps
    it for a capture-only double).
  - Manual Windows QA checklist: Notepad, VS Code, Chrome
    address bar, Teams chat — each should receive the
    transcript.

## Open questions
- Default hold-to-talk combo: `Ctrl+Alt+Space` vs `Alt+Space`
  (shorter but conflicts with window menu on many shells). Go
  with `Ctrl+Alt+Space`; document the rebind.
- Overlay rendering: reuse Coxinha's main webview as an overlay
  window (transparent, click-through) or a tiny separate Tauri
  window? Separate window simpler; overlay focus-steal risk is
  what bit Handy's Linux X11 users (#1225). Decide during
  implementation — both fit behind the same `dictation` module.
- Should `dictation-finished` also write a Markdown note with
  the transcript into the vault (opt-in toggle)? Feels like
  scope creep for this spec — leave as a separate follow-up.
