//! No-op diarizer. Returns the segments it was given, without speakers.

use std::path::Path;

use anyhow::Result;
use async_trait::async_trait;
use shared::*;

use super::Diarizer;

pub struct NoneDiarizer;

#[async_trait]
impl Diarizer for NoneDiarizer {
    async fn diarize(
        &self,
        _wav: &Path,
        segments: Vec<TranscriptSegment>,
    ) -> Result<Vec<TranscriptSegment>> {
        Ok(segments)
    }
}
