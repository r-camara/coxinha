# Spec 0008: Diarization

- **Status:** draft
- **Phase:** F1
- **Owner:** Rodolfo
- **Depends on:** spec 0007 (transcription)
- **Relevant ADRs:** ADR-0009, ADR-0010

## Why
A meeting with N people needs to know who said what for the
summary to make sense.

## Scope

### In
- `Diarizer: Send + Sync` trait with impls:
  - `NoneDiarizer` (initial F1 default)
  - `PyannoteDiarizer` via `pyannote-rs`
  - `SpeakrsDiarizer` placeholder (stub that falls back to None;
    enable in F1.5)
- pyannote pipeline: `segmentation-3.0.onnx` + wespeaker embeddings +
  clustering
- Applies speaker labels to already-transcribed segments (merge by
  timestamp overlap)
- Called automatically after `transcribe_meeting` when the configured
  diarizer is not `None`

### Out
- Live/streaming diarization → F2+
- Name-level speaker identification (not just "Speaker 1") → F4, memory

## Behavior (acceptance)
- **NoneDiarizer:** segments pass through without labels; transcript
  still saved correctly
- **Pyannote, 2 speakers:** labels `Speaker 1` / `Speaker 2` are
  consistent across the meeting (don't swap midway)
- **Missing models:** clear error; transcript is still saved (just
  without speakers)
- **Mono low-quality audio:** no crash; labels may be imprecise
  (document that a distant mic hurts quality)

## Design notes
- `src-tauri/src/diarizer/mod.rs`: factory `build(&DiarizerConfig)`
- pyannote-rs: `EmbeddingExtractor` + `EmbeddingManager` +
  `pyannote_rs::segment`
- Merge: for each transcript segment, pick the speaker segment with
  the largest overlap

## Open questions
- `pyannote-rs` actual version on crates.io: latest stable may be
  0.2.x (skeleton requests 0.3). Pin exactly.
- Clustering similarity threshold: hardcoded vs config?
- Reconciliation when diarization disagrees with the transcriber's
  VAD (Whisper sometimes breaks segments at silences)
