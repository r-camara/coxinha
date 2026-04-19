# Spec 0007: Recording & call detection

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0002 (testing baseline), spec 0003 (cold-start benchmarks)
- **Relevant ADRs:** ADR-0004 (pure Rust)
- **Related docs:** [`architecture/meeting-pipeline.md`](../architecture/meeting-pipeline.md) (state machine, recovery), [`architecture/vault-schema.md`](../architecture/vault-schema.md) (`metadata.json`, `recording.wav`)

## Why
The audio side of the product. Two concerns that only make sense
together: **detecting** when a call starts and **recording** what
happens during it. Detection without recording is useless;
recording without detection is an "always press the button"
experience we're trying to avoid.

## Scope

### In — call detection
- 3-second polling of `IAudioSessionManager2` via the Windows
  `windows` crate
- Match process name against a known-apps list (Teams, Zoom,
  Webex, Discord, Slack)
- Emit typed `CallDetected` event (once per PID; existing
  refactor already uses `Event::emit` instead of raw `json!`)
- `active_calls: Vec<ActiveCall>` reachable via `get_active_calls`
- Change-detection on the state write: only touch the mutex when
  the set of active calls actually changed
- Frontend toast with a "Record now" button wired to
  `start_recording`

### In — recording
- Mic capture via `cpal` (cross-platform)
- System-loopback capture via `wasapi` on Windows (default render
  device)
- Mix both streams into a 16kHz mono WAV (Whisper/Parakeet
  friendly)
- Resample when the native device rate isn't 16kHz
- Chunked WAV writes (header written incrementally) for crash
  resilience
- Commands: `start_recording(title) -> meeting_id`,
  `stop_recording() -> Meeting`
- Event `recording-progress` with duration + RMS level every
  200ms
- Writes `~/coxinha/meetings/<uuid>/recording.wav` +
  `metadata.json` per `vault-schema.md`
- State transitions `idle → recording → recorded` owned by
  `recorder.rs` per `meeting-pipeline.md`

### Out
- Video / screen capture → F5
- Noise suppression → future post-processing spec
- Per-process loopback (Teams-only capture) → F1.5+
- In-browser call detection (Meet, Teams Web) → future research

## Behavior (acceptance)

### Call detection
- Opening Teams + joining a call: `CallDetected` reaches the
  frontend within 3s; toast appears
- Dismissed toast: does not reappear for the same PID; PID
  going away + returning re-fires the event
- Multiple concurrent calls: each gets its own event
- Non-Windows: stub returns empty; app doesn't crash
- No write to `active_calls` mutex if the set didn't change (keeps
  downstream observers quiet)

### Recording
- **start_recording:** creates `~/coxinha/meetings/<uuid>/`,
  writes `metadata.json` with `status=recording`, starts capture;
  returns `meeting_id` in <200ms
- **stop_recording:** stops capture, finalizes WAV header, updates
  `metadata.json` with `ended_at`, `duration_seconds`,
  `status=recorded`
- **Crash while recording:** WAV remains playable up to the kill
  point (RIFF header written incrementally); next app launch sees
  `status=recording` with no `ended_at`, reconciles to `recorded`
  using the file's mtime
- **No mic device:** clean "no input device" error; no orphan
  meeting row
- **Double start:** second `start_recording` returns "already
  recording"; nothing corrupts
- **Quality:** voice is recognizable by the transcriber; no
  clipping at normal speech; start latency <500ms

## Design notes
- `src-tauri/src/recorder.rs` owns the `idle → recording →
  recorded` transitions; today only the scaffold exists
- `src-tauri/src/call_detector.rs` already carries the COM
  enumeration sketch and the change-detection pattern
- Pipeline:
  `cpal::InputStream` (mic) + `wasapi::AudioCaptureClient`
  (loopback) → ring buffers → mixer (sum + clip) → resampler
  (`rubato` or linear) → incremental `hound::WavWriter`
- Level meter: RMS over recent samples
- macOS/Linux: mic only for F1 (loopback has its own story)

## Open questions
- Linear resampling vs `rubato` — start with linear (fine for
  48k→16k voice), upgrade if quality bites us
- Mix weighting: mic is usually louder than loopback in a meeting
  — validate on real audio before tuning
- Auto-start recording on `CallDetected` (opt-in in Settings) vs
  always asking — default to asking; add opt-in in spec 0010
