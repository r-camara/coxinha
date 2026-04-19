# ADR-0001: Tauri over Electron or plain web

- **Date:** 2026-04-18
- **Status:** Accepted

## Context
We need system audio capture (loopback) and call-event detection —
both require native OS access. Plain web cannot provide them.

## Decision
Tauri 2 with a React frontend.

## Consequences
- **+** Small binary (~30MB), fast startup; WebView2 already ships with Windows 11
- **+** Rust backend pairs well with whisper-rs, wasapi, and the windows crate
- **−** WebView2 is less consistent across versions than Chrome
- **−** Tauri mobile is experimental — revisit if the app turns into a cross-device product
