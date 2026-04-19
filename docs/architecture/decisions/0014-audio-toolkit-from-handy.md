# ADR-0014: Port a minimal audio toolkit from Handy

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Our `recorder.rs` is a stub (`// TODO cpal + wasapi`). Spec 0007
needs real Windows mic + system-loopback capture, 16 kHz mono WAV
output, and a VAD to trim silence before transcription. Writing
that from scratch means re-discovering every gotcha that the
Handy team (github.com/cjpais/Handy) has already hit in
production: `0x80070005` WASAPI access denied, exclusive-mode
fallbacks, resampling rubato edge cases, VAD false positives.

## Decision
Port a **narrow subset** of Handy's `audio_toolkit/` under
MIT/whatever attribution the upstream license requires, into
`src-tauri/src/audio_toolkit/`. Scope:

- `recorder.rs` — cpal producer-consumer stream, WASAPI error
  detection, `rubato` resampler to 16 kHz mono.
- `vad/silero.rs` — Silero VAD ONNX wrapper, 30 ms frames.
- `vad/smoothed.rs` — 15-frame smoothing window.
- `utils.rs` — WAV writer helpers.

Out of scope (we write our own, thinner):
- `managers/audio.rs` god-module (Handy ~511 LOC). We keep our
  existing `recorder.rs` as the orchestrator and call into the
  toolkit primitives.
- `managers/model.rs` (1649 LOC). We'll build a much smaller
  `model_downloader.rs` for spec 0017, borrowing only the
  `DownloadCleanup` RAII pattern.
- Paste / dictation flow (`input.rs`) — Coxinha writes to the
  vault, not to the active app.
- macOS / Linux specifics (clamshell, CoreAudio fallbacks, Apple
  Intelligence).

## Consequences
- **+** We inherit battle-tested audio capture without copying a
  god-module.
- **+** Each ported file stays under ~500 LOC and carries tests
  before it lands on `main` (per spec 0002).
- **+** Silero VAD + smoothing prevents the "bursty false
  positive" class of bugs we'd have had to learn about the hard
  way.
- **−** Upstream license header must be preserved in each ported
  file, and the port gets frozen — we maintain our own copy. Any
  upstream bugfix has to be backported manually. Worth it because
  Handy's API surface is narrow.
- **−** Adds `rubato` and an ONNX runtime to our dep graph. Both
  are pure Rust and Windows-clean (already indirectly present via
  `transcribe-rs`).

## Follow-up
- Spec 0007 (recording + call detection) is the first consumer.
- A single PR per ported file, each with acceptance tests, keeps
  the diff auditable.
- Do NOT port `managers/transcription.rs` as-is. Steal only the
  `catch_unwind + LoadingGuard` pattern and wrap our existing
  `Transcriber` trait with it.
