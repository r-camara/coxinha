# ADR-0009: Diarization as a pluggable trait

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Multi-speaker meetings require diarization. Rust options:
- `pyannote-rs` — simple pipeline, CPU
- `speakrs` — full pyannote community-1 pipeline, 2-7x faster on
  CUDA, matches pyannote DER
- `sherpa-onnx` — C++ with bindings, heavy but complete

## Decision
`Diarizer: Send + Sync` trait. Implementations:
- `NoneDiarizer` (dev default; passes segments without speaker labels)
- `PyannoteDiarizer` via `pyannote-rs` (simple, stable)
- `SpeakrsDiarizer` via `speakrs` (production)

## Consequences
- **+** MVP does not depend on diarization working
- **+** Upgrading from pyannote-rs → speakrs is a config change
- **−** Extra ONNX models to download (~100MB)
