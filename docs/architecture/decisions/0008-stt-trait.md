# ADR-0008: STT as a pluggable trait (Whisper + Parakeet)

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Whisper is the de facto standard, but NVIDIA's Parakeet-TDT-0.6B-v3
is faster (6.34% WER vs Whisper-large-v3 on HF Open ASR) and
supports 25 languages including Portuguese. Different users prefer
different trade-offs.

## Decision
A `transcriber/` module with a `Transcriber: Send + Sync` trait.
Implementations:
- `WhisperTranscriber` via `whisper-rs` (default, easy to build)
- `ParakeetTranscriber` via `transcribe-rs` + `ort`

Selection driven by `config.toml`. Models live under
`~/coxinha/.coxinha/models/`.

## Consequences
- **+** User picks an engine without recompiling
- **+** Parakeet-TDT-v3 beats Whisper-large on throughput and multilingual WER
- **+** `transcribe-rs` adds Canary, Moonshine, SenseVoice for free
- **−** Two pipelines to maintain
- **−** Parakeet's Portuguese training is European, not Brazilian, so
  there may be minor degradation — offset by speed
