# Spec 0017: Installer & first-run onboarding

- **Status:** draft
- **Phase:** F1.5
- **Owner:** Rodolfo
- **Depends on:** specs 0007–0008 (the meeting loop)
- **Relevant ADRs:** ADR-0010 (ONNX runtime)

## Why
Clicking an installer and ending up with a working app — without
editing YAML, running shell commands, or guessing which files go
where — is the difference between "shipped product" and "demo my
friend can't run".

## Scope

### In
- **Two installer variants:**
  - `Coxinha-<ver>-x64-cpu.msi` (~30MB, no CUDA DLLs)
  - `Coxinha-<ver>-x64-cuda.msi` (~300MB, bundles ONNX Runtime
    CUDA + cuDNN + whisper-rs CUDA artifacts)
- **First-run wizard** (a `/onboarding` route rendered until a
  `config.onboarding_done` flag flips):
  1. Detect Ollama on `localhost:11434` — offer "use it" or skip
  2. Prompt to download Whisper base (~150MB) with progress +
     resumable download + sha256 verify
  3. Offer Parakeet (opt-in, +550MB, mentions speed trade-off)
  4. **Test microphone** (Handy #1283 + #1284 addendum): open
     the configured input device, measure cold-start latency
     from "click Start" to first non-silent sample, ask the user
     to say a short phrase, confirm samples were captured. If
     latency > 300ms or capture is silent, show a clear error
     with device picker + "try again" — never silently proceed.
     On Windows, detect `0x80070005` (WASAPI access denied) and
     link to the mic privacy settings.
  5. Detect existing Obsidian vaults (spec 0037); if any, offer
     to adopt one as the Coxinha vault root
  6. Create `~/coxinha/` tree + default `config.toml`
  7. Welcome screen: new-note shortcut reminder + "Record a test
     meeting" CTA
- GPU detection: if the CUDA installer is running on a machine
  without NVIDIA GPU, wizard warns and links to the CPU installer
- Error messaging: every failure surfaces a clear action
  ("Ollama not found. Install from ollama.com or skip for now.")

### Out
- Auto-update (**explicit invariant**: opt-in only; see CLAUDE.md)
- Enterprise deployment (group policy, MSI transforms) → F3+
- Portable/no-install build → F2+

## Behavior (acceptance)
- **Happy path:** clean Windows 11 VM → install MSI → launch →
  complete wizard → record a 10-second test meeting → transcribe
  → summary shows. Zero CLI.
- **No network:** wizard skips model downloads with a clear
  explanation and lets the user complete onboarding; subsequent
  model download available from Settings.
- **Broken GPU:** CUDA installer on a CPU-only box boots with a
  warning and the wizard forces CPU accelerator defaults.
- **Interrupted download:** resume on next launch (partial file
  saved with `.part` suffix).

## Design notes
- Wizard is React routed to `/onboarding`; the "done" flag lives
  in `AppConfig`
- Model download is a `download_model(id, on_progress)` IPC
  command returning progress events
- sha256 hashes bundled in a compile-time manifest
  (`src-tauri/resources/models.toml`)
- Installer variants built by the existing release workflow with
  a feature-flag matrix

## Open questions
- Ship models inside the MSI vs download on first run? Download —
  keeps the installer small and lets users pick quality/size.
- Allow switching CPU↔CUDA without reinstalling? v1 says no
  (reinstall required); revisit once `ort` supports runtime EP
  switching cleanly.
