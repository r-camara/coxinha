# Spec 0007: Whisper / Parakeet transcription

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0006 (recording)
- **Relevant ADRs:** ADR-0004, ADR-0008, ADR-0010

## Why
A transcribed meeting is the raw material for summarization,
search, and memory. Local-first means we don't ship audio to the
cloud.

## Scope

### In
- `Transcriber: Send + Sync` trait with impls:
  - `WhisperTranscriber` via `whisper-rs` (default, GGUF)
  - `ParakeetTranscriber` via `transcribe-rs` + ONNX INT8
- Choice via `config.toml` (`TranscriberConfig`)
- Lazy load on first use
- Command `transcribe_meeting(id) -> Transcript`
- Saves `~/coxinha/meetings/<id>/transcript.json`
- `transcription-progress` event with percent
- Acceleration: CPU by default; `cuda`/`directml` optional via
  feature flags

### Out
- Diarization → spec 0008 (separate, so Whisper works without
  speakers)
- Streaming (realtime) transcription → F1.5+
- Manual transcript editing → F1.5+

## Behavior (acceptance)
- **First transcribe after boot:** <10s for 1 min of audio on CPU
  with the base model; <3s with CUDA
- **Subsequent transcribes:** model cached, shorter cold-start
- **Invalid or missing WAV:** clear error, no crash
- **Model missing:** error instructs running
  `scripts/download-models.sh`
- **Swap engine** in the config + restart: next transcribe uses the
  new engine without any code change
- **Language:** auto-detected; non-English languages come out
  reasonable (<20% WER with `base`; <10% with `large-v3`)
- **Idempotency:** retranscribing overwrites `transcript.json`, does
  not append

## Design notes
- `src-tauri/src/transcriber/mod.rs`: factory
  `build(&TranscriberConfig)`
- `src-tauri/src/transcriber/whisper.rs`, `parakeet.rs`:
  `#![cfg(feature = "stt-...")]`
- Audio pre-processing: 16kHz mono f32 (spec 0006 already delivers this)
- Execution: `tokio::task::spawn_blocking` to avoid blocking the runtime

## Open questions
- `transcribe-rs 0.3` API: confirm `ParakeetModel::load`,
  `ParakeetParams`, `set_ort_accelerator` match what actually exists
- Default dev model: `ggml-base.bin` (~150MB) vs `tiny` (~75MB).
  Base is noticeably better in PT; the size trade-off is worth it.
- UX: auto-transcribe on `stop_recording` or only on demand?
  Default: on demand (the CPU/GPU cost should be explicit).
