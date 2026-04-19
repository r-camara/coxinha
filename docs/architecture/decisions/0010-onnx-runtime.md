# ADR-0010: ONNX Runtime (`ort`) as the ML runtime

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
Parakeet, pyannote segmentation, wespeaker embeddings, speakrs —
all use ONNX. We need a unified runtime.

## Decision
`ort` (pykeio) as a shared dependency. Execution providers:
- CPU (default)
- CUDA (feature `cuda`)
- DirectML (Windows, feature `directml`)
- CoreML (macOS, future)

## Consequences
- **+** A single ML runtime, downloaded once
- **+** TensorRT support available for further acceleration
- **−** `ort 2.0.0-rc` is still RC; breaking changes possible
- **−** ONNX DLLs must be bundled (use the `copy-dylibs` feature)
