//! Parakeet TDT via `transcribe-rs` + ONNX Runtime.
//!
//! Recommended model: `nvidia/parakeet-tdt-0.6b-v3` in INT8.
//! Supports 25 European languages including Portuguese.
//!
//! Download via `scripts/download-models.sh`.

#![cfg(feature = "stt-parakeet")]

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use anyhow::{Context, Result};
use async_trait::async_trait;
use shared::*;
use transcribe_rs::onnx::parakeet::ParakeetModel;

use super::Transcriber;

pub struct ParakeetTranscriber {
    model_dir: PathBuf,
    accelerator: Accelerator,
    // Loaded on first use, then reused across calls.
    model: Arc<Mutex<Option<ParakeetModel>>>,
}

impl ParakeetTranscriber {
    pub fn new(model_dir: PathBuf, accelerator: Accelerator) -> Result<Self> {
        Ok(Self {
            model_dir,
            accelerator,
            model: Arc::new(Mutex::new(None)),
        })
    }

    fn ensure_loaded(&self) -> Result<()> {
        let mut guard = self.model.lock().unwrap();
        if guard.is_some() {
            return Ok(());
        }

        // Configure the ONNX Runtime execution provider right before we
        // load the model — this is a global `ort` setting, so doing it
        // earlier (e.g. in `new()`) would clobber other users.
        use transcribe_rs::{set_ort_accelerator, OrtAccelerator};
        set_ort_accelerator(match self.accelerator {
            Accelerator::Cpu => OrtAccelerator::Cpu,
            Accelerator::Cuda => OrtAccelerator::Cuda,
            Accelerator::DirectMl => OrtAccelerator::DirectMl,
            Accelerator::CoreMl => OrtAccelerator::CoreMl,
        });

        let model = ParakeetModel::load(&self.model_dir, &transcribe_rs::onnx::Quantization::Int8)
            .with_context(|| format!("loading parakeet from {}", self.model_dir.display()))?;
        *guard = Some(model);
        Ok(())
    }
}

#[async_trait]
impl Transcriber for ParakeetTranscriber {
    async fn transcribe_file(&self, wav: &Path) -> Result<TranscriptBody> {
        self.ensure_loaded()?;

        let wav = wav.to_path_buf();
        let model_slot = self.model.clone();

        tokio::task::spawn_blocking(move || -> Result<TranscriptBody> {
            use transcribe_rs::onnx::parakeet::{ParakeetParams, TimestampGranularity};

            let mut guard = model_slot.lock().unwrap();
            let model = guard
                .as_mut()
                .ok_or_else(|| anyhow::anyhow!("parakeet model not loaded"))?;

            let samples = transcribe_rs::audio::read_wav_samples(&wav)?;
            let result = model.transcribe_with(
                &samples,
                &ParakeetParams {
                    timestamp_granularity: Some(TimestampGranularity::Segment),
                    ..Default::default()
                },
            )?;

            let segments: Vec<TranscriptSegment> = result
                .segments
                .into_iter()
                .map(|s| TranscriptSegment {
                    start: s.start as f32,
                    end: s.end as f32,
                    text: s.text.trim().to_string(),
                    speaker: None,
                    confidence: None,
                })
                .collect();

            Ok(TranscriptBody {
                language: result.language,
                segments,
            })
        })
        .await?
    }
}
