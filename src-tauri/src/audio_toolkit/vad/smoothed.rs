//! Sliding-window smoother over raw VAD decisions.
//!
//! Ported from Handy's `audio_toolkit/vad/smoothed.rs` (MIT). Purely
//! combinatorial — no ONNX, no I/O — so tests stay deterministic and
//! run without the Silero model loaded.
//!
//! A single `Speech` frame surrounded by `Noise` (a cough, a chair
//! creak, the VAD flickering on 0.49→0.51) should not trip the
//! recorder's "speech detected" transition. We keep the last
//! `window` raw decisions and only call it speech when at least
//! `min_speech_frames` of them landed on the Speech side.

use std::collections::VecDeque;

use super::VadFrame;

/// Smoothed-window VAD. Default matches Handy's upstream: a 15-frame
/// window with a 3-frame speech floor.
pub struct SmoothedVad {
    window: usize,
    min_speech_frames: usize,
    history: VecDeque<VadFrame>,
    speech_count: usize,
}

impl SmoothedVad {
    pub fn new(window: usize, min_speech_frames: usize) -> Self {
        assert!(window > 0, "window must be positive");
        assert!(
            min_speech_frames <= window,
            "min_speech_frames ({}) cannot exceed window ({})",
            min_speech_frames,
            window
        );
        Self {
            window,
            min_speech_frames,
            history: VecDeque::with_capacity(window),
            speech_count: 0,
        }
    }

    /// Defaults Handy ships with: `window=15`, `min_speech_frames=3`.
    pub fn with_defaults() -> Self {
        Self::new(15, 3)
    }

    /// Feeds a raw frame decision, returns the smoothed verdict over
    /// the current window. Before the window fills, we err on the
    /// side of `Noise` — the recorder should not start transcribing
    /// on the first two frames.
    pub fn push(&mut self, frame: VadFrame) -> VadFrame {
        if self.history.len() == self.window {
            if let Some(old) = self.history.pop_front() {
                if old == VadFrame::Speech {
                    self.speech_count -= 1;
                }
            }
        }
        self.history.push_back(frame);
        if frame == VadFrame::Speech {
            self.speech_count += 1;
        }

        if self.speech_count >= self.min_speech_frames {
            VadFrame::Speech
        } else {
            VadFrame::Noise
        }
    }

    /// Clears the window — used when the recorder stops or after a
    /// long pause so a stale Speech decision doesn't persist.
    pub fn reset(&mut self) {
        self.history.clear();
        self.speech_count = 0;
    }

    pub fn window(&self) -> usize {
        self.window
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run(s: &mut SmoothedVad, seq: &[VadFrame]) -> Vec<VadFrame> {
        seq.iter().map(|f| s.push(*f)).collect()
    }

    #[test]
    fn stays_in_noise_before_window_fills() {
        let mut s = SmoothedVad::new(5, 3);
        // Only 2 speech frames — below the 3-floor.
        let out = run(&mut s, &[VadFrame::Speech, VadFrame::Speech]);
        assert_eq!(out, vec![VadFrame::Noise, VadFrame::Noise]);
    }

    #[test]
    fn flips_to_speech_once_floor_is_reached() {
        let mut s = SmoothedVad::new(5, 3);
        let out = run(
            &mut s,
            &[
                VadFrame::Speech,
                VadFrame::Speech,
                VadFrame::Speech,
                VadFrame::Speech,
            ],
        );
        assert_eq!(
            out,
            vec![
                VadFrame::Noise,
                VadFrame::Noise,
                VadFrame::Speech,
                VadFrame::Speech,
            ]
        );
    }

    #[test]
    fn single_noisy_frame_does_not_flip_a_steady_speech_run() {
        let mut s = SmoothedVad::new(5, 3);
        for _ in 0..5 {
            s.push(VadFrame::Speech);
        }
        // Inject a stray Noise — we should stay in Speech because
        // 4 of the last 5 frames are still speech.
        assert_eq!(s.push(VadFrame::Noise), VadFrame::Speech);
    }

    #[test]
    fn speech_decays_out_when_silence_dominates() {
        let mut s = SmoothedVad::new(5, 3);
        // Fill with speech.
        for _ in 0..5 {
            s.push(VadFrame::Speech);
        }
        // Flood with noise — decision should return to Noise once
        // speech count drops below 3.
        let out: Vec<VadFrame> = (0..5).map(|_| s.push(VadFrame::Noise)).collect();
        assert_eq!(
            out,
            vec![
                VadFrame::Speech,
                VadFrame::Speech,
                VadFrame::Noise,
                VadFrame::Noise,
                VadFrame::Noise,
            ]
        );
    }

    #[test]
    fn reset_clears_history_and_returns_to_noise() {
        let mut s = SmoothedVad::new(5, 3);
        for _ in 0..5 {
            s.push(VadFrame::Speech);
        }
        s.reset();
        // Fresh window — needs 3 more speech frames to flip.
        assert_eq!(s.push(VadFrame::Speech), VadFrame::Noise);
        assert_eq!(s.push(VadFrame::Speech), VadFrame::Noise);
        assert_eq!(s.push(VadFrame::Speech), VadFrame::Speech);
    }

    #[test]
    #[should_panic(expected = "min_speech_frames")]
    fn rejects_floor_larger_than_window() {
        SmoothedVad::new(3, 5);
    }

    #[test]
    fn with_defaults_matches_handy_ratios() {
        let s = SmoothedVad::with_defaults();
        assert_eq!(s.window(), 15);
    }
}
