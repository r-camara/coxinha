# Spec 0006: Mic + loopback recording

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** ADR-0004 (pure Rust)

## Why
To transcribe/summarize a meeting without a bot, we must capture
system audio (the other side) and the mic (you) into a single
recording.

## Scope

### In
- Mic capture via `cpal` (cross-platform)
- Default output-device loopback capture via `wasapi` (Windows)
- Mix both streams into a 16kHz mono WAV (ideal for Whisper/Parakeet)
- Resampling when the native device is not 16kHz
- Chunked writes for crash resilience
- Commands: `start_recording(title) -> meeting_id`, `stop_recording()`
- `recording-progress` event (duration + level) every N ms
- Artifacts at `~/coxinha/meetings/<id>/recording.wav` + `metadata.json`

### Out
- Video / screen capture → F5
- Noise suppression → optional post-processing, future spec
- Process-scoped capture (Teams-only) → F1.5+

## Behavior (acceptance)
- **start_recording:** creates the dir, writes metadata, begins
  capture; returns the meeting_id within 200ms
- **stop_recording:** stops capture, finalizes the WAV header,
  updates the DB with duration; returns a Meeting
- **Crash while recording:** WAV written so far is valid and plays
  in any player (RIFF header written incrementally)
- **No mic available:** clean failure with "no input device" error,
  no orphan meeting left in the DB
- **Double start:** `start_recording` while already recording returns
  "already recording", does not corrupt anything
- **Quality:** voice is recognizable by the transcriber; no clipping
  at normal speech levels; start latency <500ms

## Design notes
- `src-tauri/src/recorder.rs`: today only start/stop scaffold
- Pipeline: `cpal::InputStream` (mic) + `wasapi::AudioCaptureClient`
  (loopback) → two ring buffers → mixer (sum + clip) → resampler
  (`rubato` or similar) → incremental `hound::WavWriter`
- Level meter: RMS over recent samples, emitted every 200ms
- macOS/Linux: mic only for now (loopback is its own story)

## Open questions
- `rubato` vs linear resampling: start linear (fine for 48k→16k
  voice), upgrade if quality suffers
- Mix: plain sum or weighted? Mic is usually louder than loopback
  in a meeting; validate on real audio.
- Loopback vs per-process capture: for now, grab the whole default
  render device; filtering per process is F1.5
