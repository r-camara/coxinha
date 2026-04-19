//! Types shared between the desktop app (src-tauri) and the future backend (F2).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

// -- Notes --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct Note {
    pub id: Uuid,
    pub title: String,
    pub path: String,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct NoteContent {
    pub note: Note,
    pub markdown: String,
}

// -- Meetings --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct Meeting {
    pub id: Uuid,
    pub title: String,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<u32>,
    pub participants: Vec<String>,
    pub recording_path: Option<String>,
    pub has_transcript: bool,
    pub has_summary: bool,
    pub source_app: Option<String>, // Teams, Zoom, Meet, etc.
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
pub struct TranscriptSegment {
    pub start: f32,
    pub end: f32,
    pub text: String,
    pub speaker: Option<String>,
    pub confidence: Option<f32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
pub struct Transcript {
    pub meeting_id: Uuid,
    pub language: Option<String>,
    pub segments: Vec<TranscriptSegment>,
}

/// Transcriber output without a meeting id — the caller attaches it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
pub struct TranscriptBody {
    pub language: Option<String>,
    pub segments: Vec<TranscriptSegment>,
}

// -- Call detection --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct ActiveCall {
    pub app_name: String,
    pub process_name: String,
    pub pid: u32,
    pub is_browser: bool,
    pub detected_at: DateTime<Utc>,
}

// -- LLM providers --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum LlmProvider {
    Ollama { endpoint: String, model: String },
    Claude { model: String },
    OpenAI { model: String },
    Groq { model: String },
    OpenRouter { model: String },
}

impl LlmProvider {
    pub fn model(&self) -> &str {
        match self {
            LlmProvider::Ollama { model, .. }
            | LlmProvider::Claude { model }
            | LlmProvider::OpenAI { model }
            | LlmProvider::Groq { model }
            | LlmProvider::OpenRouter { model } => model,
        }
    }
}

// -- Transcriber config --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "engine", rename_all = "snake_case")]
pub enum TranscriberConfig {
    /// No transcription engine. The app still records audio and
    /// stores meetings — transcription commands return an explicit
    /// "engine not configured" error. This is the default for fresh
    /// installs so the app boots without a model on disk.
    None,
    Whisper {
        model_path: String,
        accelerator: Accelerator,
    },
    Parakeet {
        model_dir: String,
        accelerator: Accelerator,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum Accelerator {
    Cpu,
    Cuda,
    DirectMl,
    CoreMl,
}

// -- Diarizer config --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "engine", rename_all = "snake_case")]
pub enum DiarizerConfig {
    None,
    Pyannote {
        segmentation_model: String,
        embedding_model: String,
    },
    Speakrs {
        model_dir: String,
        accelerator: Accelerator,
    },
}

// -- App config (full) --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct AppConfig {
    pub vault_path: String,
    /// BCP-47 language tag (e.g. "en", "pt-BR"). Empty means "use OS default".
    #[serde(default)]
    pub locale: String,
    pub transcriber: TranscriberConfig,
    pub diarizer: DiarizerConfig,
    pub llm: LlmProvider,
    pub autostart: bool,
    pub shortcuts: ShortcutsConfig,
}

// -- Tag aggregates (spec 0014) --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct TagCount {
    pub tag: String,
    pub count: u32,
}

// -- Rebuild stats (spec 0005) --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct RebuildStats {
    pub notes_indexed: u32,
    pub links_indexed: u32,
    /// Files the walker found but couldn't index (unreadable, invalid
    /// UTF-8, symlink loop). Shown in the UI only when non-zero so
    /// the happy path stays quiet.
    pub notes_skipped: u32,
}

// -- Obsidian vault detection (spec 0037) --

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct ObsidianVault {
    /// Stable id Obsidian itself assigns in `obsidian.json` — used
    /// only to round-trip selections from the UI.
    pub id: String,
    /// Folder name (leaf of `path`), shown in the Settings list.
    pub name: String,
    /// Absolute filesystem path.
    pub path: String,
    /// Last time Obsidian opened this vault, ms since epoch. `None`
    /// when the config has no timestamp — some older installs omit
    /// the field.
    pub last_opened_ms: Option<i64>,
    /// Whether `path` actually exists today. A `false` here means
    /// Obsidian still lists the vault but the user deleted or moved
    /// the folder.
    pub exists: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct ShortcutsConfig {
    pub new_note: String,
    pub open_app: String,
    pub agenda: String,
    pub meetings: String,
    pub toggle_recording: String,
}

impl Default for ShortcutsConfig {
    fn default() -> Self {
        Self {
            new_note: "Ctrl+Alt+N".into(),
            open_app: "Ctrl+Alt+C".into(),
            agenda: "Ctrl+Alt+A".into(),
            meetings: "Ctrl+Alt+M".into(),
            toggle_recording: "Ctrl+Alt+R".into(),
        }
    }
}
