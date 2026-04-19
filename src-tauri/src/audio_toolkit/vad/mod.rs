//! Voice Activity Detection primitives.
//!
//! Frame-based: 512 samples at 16 kHz (~32 ms) — the chunk size
//! Silero v5 expects. Recorder code feeds these buffers in order;
//! `SileroVad` returns a `Speech` / `Noise` decision per frame, and
//! `SmoothedVad` coalesces them with a 15-frame window so a single
//! noisy spike doesn't flip the state.

pub mod silero;
pub mod smoothed;

pub const FRAME_SIZE: usize = 512;
pub const SAMPLE_RATE: u32 = 16_000;

/// Per-frame classification.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VadFrame {
    Speech,
    Noise,
}
