//! Typed events emitted to the frontend. Each type derives
//! `tauri_specta::Event` so it emits under its snake_case name and
//! shows up in the generated TypeScript bindings.

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct CallDetected {
    pub app_name: String,
    pub process_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct RecordingProgress {
    pub meeting_id: Uuid,
    pub duration_seconds: u32,
    pub level_db: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct TranscriptionProgress {
    pub meeting_id: Uuid,
    pub percent: f32,
    pub message: String,
}
