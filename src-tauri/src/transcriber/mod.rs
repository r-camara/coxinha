//! `Transcriber` trait with pluggable implementations.
//!
//! Selection via `config.toml`:
//! ```toml
//! [transcriber]
//! engine = "parakeet"  # or "whisper"
//! model_dir = "~/coxinha/.coxinha/models/parakeet-tdt-0.6b-v3-int8"
//! accelerator = "cuda"
//! ```

use std::path::Path;
use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
use shared::*;

pub mod parakeet;
pub mod whisper;

/// Common interface. All impls are `Send + Sync` so they can live
/// inside an `Arc`.
#[async_trait]
pub trait Transcriber: Send + Sync {
    /// Transcribe a WAV file (16kHz mono expected). The returned
    /// `TranscriptBody` carries segments + optional language; the
    /// caller attaches the meeting id.
    async fn transcribe_file(&self, wav: &Path) -> Result<TranscriptBody>;
}

pub fn build(config: &TranscriberConfig) -> Result<Arc<dyn Transcriber>> {
    match config {
        TranscriberConfig::Whisper {
            model_path,
            accelerator,
        } => {
            #[cfg(feature = "stt-whisper")]
            {
                Ok(Arc::new(whisper::WhisperTranscriber::new(
                    model_path.into(),
                    *accelerator,
                )?))
            }
            #[cfg(not(feature = "stt-whisper"))]
            {
                let _ = (model_path, accelerator);
                anyhow::bail!("stt-whisper feature not enabled at compile time")
            }
        }
        TranscriberConfig::Parakeet {
            model_dir,
            accelerator,
        } => {
            #[cfg(feature = "stt-parakeet")]
            {
                Ok(Arc::new(parakeet::ParakeetTranscriber::new(
                    model_dir.into(),
                    *accelerator,
                )?))
            }
            #[cfg(not(feature = "stt-parakeet"))]
            {
                let _ = (model_dir, accelerator);
                anyhow::bail!("stt-parakeet feature not enabled at compile time")
            }
        }
    }
}
