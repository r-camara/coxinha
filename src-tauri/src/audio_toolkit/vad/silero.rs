//! Silero VAD (v5) wrapper. Ported from Handy's
//! `audio_toolkit/vad/silero.rs` (MIT).
//!
//! Model weights (`silero_vad.onnx`, ~2 MB) live under
//! `src-tauri/resources/` and are embedded at compile time via
//! `include_bytes!`. No runtime file path, no first-run download —
//! consistent with spec 0017's preference for bundled dev assets.
//!
//! Silero v5 takes three tensors per frame:
//! - `input` : `f32[1, 512]`   — raw PCM samples, mono, 16 kHz
//! - `state` : `f32[2, 1, 128]` — LSTM state, persisted across calls
//! - `sr`    : `i64[1]`        — sample rate (we always pass 16000)
//!
//! It returns:
//! - `output` : `f32[1, 1]`       — probability of speech in the frame
//! - `stateN` : `f32[2, 1, 128]`  — updated LSTM state to feed back

use anyhow::Result;
use ndarray::{Array1, Array2, Array3, Ix3};
use ort::session::Session;
use ort::value::Tensor;

use super::{VadFrame, FRAME_SIZE, SAMPLE_RATE};

/// ~2.3 MB of ONNX goes into `.rodata`. Acceptable cost — spec 0017
/// already plans larger model downloads for Whisper/Parakeet; VAD is
/// small enough to embed.
static MODEL_BYTES: &[u8] =
    include_bytes!("../../../resources/silero_vad.onnx");

pub struct SileroVad {
    session: Session,
    state: Array3<f32>,
    threshold: f32,
}

impl SileroVad {
    /// `threshold` in `[0.0, 1.0]`. 0.5 is Silero's ship default;
    /// Handy runs at 0.5 too.
    pub fn new(threshold: f32) -> Result<Self> {
        let session = Session::builder()?.commit_from_memory(MODEL_BYTES)?;
        Ok(Self {
            session,
            state: Array3::<f32>::zeros((2, 1, 128)),
            threshold: threshold.clamp(0.0, 1.0),
        })
    }

    /// Runs the model on one frame and returns a `Speech`/`Noise`
    /// decision. Errors bubble from `ort` — callers can fall back to
    /// a noop VAD (always `Speech`) if the model ever fails to load.
    pub fn push_frame(&mut self, frame: &[f32]) -> Result<VadFrame> {
        anyhow::ensure!(
            frame.len() == FRAME_SIZE,
            "silero expects {} samples per frame, got {}",
            FRAME_SIZE,
            frame.len()
        );

        let input = Array2::from_shape_vec((1, FRAME_SIZE), frame.to_vec())?;
        let sr = Array1::from_vec(vec![SAMPLE_RATE as i64]);

        let input_t = Tensor::from_array(input)?;
        let state_t = Tensor::from_array(self.state.clone())?;
        let sr_t = Tensor::from_array(sr)?;

        let outputs = self.session.run(ort::inputs![
            "input" => input_t,
            "state" => state_t,
            "sr" => sr_t,
        ])?;

        let prob_view = outputs["output"].try_extract_array::<f32>()?;
        let prob = prob_view.iter().next().copied().unwrap_or(0.0);

        let state_view = outputs["stateN"].try_extract_array::<f32>()?;
        self.state = state_view.to_owned().into_dimensionality::<Ix3>()?;

        Ok(if prob >= self.threshold {
            VadFrame::Speech
        } else {
            VadFrame::Noise
        })
    }

    /// Drops the LSTM state. Call when the recorder stops, or when
    /// the audio source changes — carrying state across a boundary
    /// would bias the next frame.
    pub fn reset(&mut self) {
        self.state.fill(0.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn silero_loads_from_bundled_bytes() {
        // Bare minimum: the embedded ONNX is valid and ort accepts
        // it. Any malformed-model regression (e.g. corrupted asset
        // replacement) surfaces here before touching audio code.
        let vad = SileroVad::new(0.5);
        assert!(vad.is_ok(), "silero init failed: {:?}", vad.err());
    }

    #[test]
    fn silence_is_classified_as_noise() {
        let mut vad = SileroVad::new(0.5).expect("silero init");
        // 512 samples of dead silence — Silero should report very
        // low speech probability.
        let silence = vec![0.0f32; FRAME_SIZE];
        let frame = vad.push_frame(&silence).expect("push_frame");
        assert_eq!(frame, VadFrame::Noise);
    }

    #[test]
    fn reset_does_not_corrupt_subsequent_runs() {
        let mut vad = SileroVad::new(0.5).expect("silero init");
        let silence = vec![0.0f32; FRAME_SIZE];

        vad.push_frame(&silence).unwrap();
        vad.reset();
        // State is zero again; running silence still yields Noise.
        let f = vad.push_frame(&silence).unwrap();
        assert_eq!(f, VadFrame::Noise);
    }

    #[test]
    fn rejects_wrong_frame_size() {
        let mut vad = SileroVad::new(0.5).expect("silero init");
        let short = vec![0.0f32; 256];
        let err = vad.push_frame(&short).unwrap_err();
        assert!(err.to_string().contains("silero expects 512 samples"));
    }
}
