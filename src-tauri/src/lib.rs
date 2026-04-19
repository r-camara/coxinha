//! Coxinha library entry point.
//!
//! - Sets up logging
//! - Registers Tauri plugins
//! - Creates the tray icon
//! - Registers global shortcuts
//! - Exposes typed IPC commands (specta)

// Port from Handy (ADR-0014). Items stay `pub` so spec 0007 wires
// the recorder into them directly — the whole module is dead code
// in the crate today and `#[allow(dead_code)]` here keeps the port
// faithful without sprinkling the allow attribute on every symbol.
#[allow(dead_code)]
mod audio_toolkit;
mod call_detector;
mod config;
mod db;
mod diarizer;
mod events;
mod obsidian;
mod recorder;
mod shortcuts;
mod storage;
mod summarizer;
mod transcriber;
mod tray;
mod window;

use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;
use tracing::info;

use crate::config::AppState;

// Load YAML locale files from `src-tauri/locales/` at compile time.
// Use `t!("tray.open")` etc. from anywhere in the crate.
rust_i18n::i18n!("locales", fallback = "en");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "coxinha=debug,info".into()),
        )
        .init();

    set_initial_locale();

    info!("Coxinha starting...");

    let specta_builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(tauri_specta::collect_commands![
            commands::create_note,
            commands::update_note,
            commands::delete_note,
            commands::list_notes,
            commands::get_note,
            commands::search_notes,
            commands::list_meetings,
            commands::get_meeting,
            commands::start_recording,
            commands::stop_recording,
            commands::transcribe_meeting,
            commands::summarize_meeting,
            commands::get_active_calls,
            commands::save_attachment,
            commands::get_config,
            commands::update_config,
            commands::list_obsidian_vaults,
            commands::get_or_create_daily_note,
            commands::get_backlinks,
            commands::rebuild_from_vault,
        ])
        .events(tauri_specta::collect_events![
            events::CallDetected,
            events::RecordingProgress,
            events::TranscriptionProgress,
        ]);

    // The generated file re-imports `Channel` from Tauri whether we
    // use channel types or not, which trips TypeScript's
    // `noUnusedLocals`. `@ts-nocheck` is the accepted pattern for
    // machine-generated code — consumers still get the types because
    // they flow through re-exports, not through the file's own check.
    #[cfg(debug_assertions)]
    specta_builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number)
                .header("// @ts-nocheck\n/* eslint-disable */\n"),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export TS bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(shortcuts::handle_shortcut)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .invoke_handler(specta_builder.invoke_handler())
        .setup(move |app| {
            specta_builder.mount_events(app);

            let state = AppState::initialize(app.handle())?;

            // Register shortcuts using the freshly-loaded config, before
            // wrapping state in Arc<Mutex> — avoids a block_on inside setup.
            shortcuts::register_all(app.handle(), &state.config.shortcuts)?;

            if !state.config.locale.is_empty() {
                rust_i18n::set_locale(&normalize_locale(&state.config.locale));
            }

            let shared_state = Arc::new(Mutex::new(state));
            app.manage(shared_state);

            tray::setup(app.handle())?;

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = call_detector::run_loop(handle).await {
                    tracing::error!("Call detector loop failed: {:?}", e);
                }
            });

            info!("Coxinha ready");
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window hides it (tray-resident); real quit
            // only goes through the tray menu or `app.exit()`.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Seed `rust-i18n` with the OS locale before the tray menu or any
/// other `t!(...)` call runs. The persisted config may override this
/// later during `AppState::initialize`.
fn set_initial_locale() {
    if let Some(locale) = sys_locale::get_locale() {
        rust_i18n::set_locale(&normalize_locale(&locale));
    }
}

/// Trim a BCP-47 tag down to the base language when a region-specific
/// catalog isn't available (`en-US` → `en`). `rust-i18n` already falls
/// back via the `fallback = "en"` directive, but normalizing here
/// avoids one failed lookup per key.
fn normalize_locale(raw: &str) -> String {
    raw.split(['-', '_']).next().unwrap_or("en").to_lowercase()
}

mod commands {
    use super::*;
    use shared::*;
    use uuid::Uuid;

    #[tauri::command]
    #[specta::specta]
    pub async fn create_note(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        title: String,
        content: String,
    ) -> Result<Note, String> {
        let state = state.lock().await;
        state
            .storage
            .create_note(&title, &content)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn update_note(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
        content: String,
    ) -> Result<Note, String> {
        let state = state.lock().await;
        state
            .storage
            .update_note(id, &content)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn delete_note(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
    ) -> Result<(), String> {
        let state = state.lock().await;
        state
            .storage
            .delete_note(id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn list_notes(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<Vec<Note>, String> {
        let state = state.lock().await;
        state.storage.list_notes().await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn get_note(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
    ) -> Result<NoteContent, String> {
        let state = state.lock().await;
        state.storage.get_note(id).await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn search_notes(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        query: String,
    ) -> Result<Vec<Note>, String> {
        let state = state.lock().await;
        state
            .storage
            .search_notes(&query)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn list_meetings(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<Vec<Meeting>, String> {
        let state = state.lock().await;
        state
            .storage
            .list_meetings()
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn get_meeting(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
    ) -> Result<Meeting, String> {
        let state = state.lock().await;
        state
            .storage
            .get_meeting(id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn start_recording(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        title: String,
    ) -> Result<Uuid, String> {
        let mut state = state.lock().await;
        state
            .recorder
            .start(&title)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn stop_recording(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<Meeting, String> {
        let mut state = state.lock().await;
        state.recorder.stop().await.map_err(|e| e.to_string())
    }

    /// TODO(spec 0008): orchestrate recorder → transcriber → diarizer
    /// → write `transcript.json` → flip `has_transcript`. Left as a
    /// deliberate bail! so the IPC surface exists without pretending
    /// to work.
    #[tauri::command]
    #[specta::specta]
    pub async fn transcribe_meeting(
        _state: tauri::State<'_, Arc<Mutex<AppState>>>,
        _id: Uuid,
    ) -> Result<Transcript, String> {
        Err("transcribe_meeting is not wired yet (see spec 0008)".into())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn summarize_meeting(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
    ) -> Result<String, String> {
        let state = state.lock().await;
        state
            .summarizer
            .summarize_meeting(id)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn get_active_calls(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<Vec<ActiveCall>, String> {
        let state = state.lock().await;
        Ok(state.active_calls.clone())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn save_attachment(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        filename: String,
        bytes: Vec<u8>,
    ) -> Result<String, String> {
        let state = state.lock().await;
        state
            .storage
            .save_attachment(&filename, &bytes)
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn get_config(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<AppConfig, String> {
        let state = state.lock().await;
        Ok(state.config.clone())
    }

    #[tauri::command]
    #[specta::specta]
    pub async fn update_config(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        config: AppConfig,
    ) -> Result<(), String> {
        let mut state = state.lock().await;
        state.update_config(config).await.map_err(|e| e.to_string())
    }

    /// Settings (spec 0037) calls this to populate the "Adopt an
    /// Obsidian vault" picker. Returns `[]` when Obsidian isn't
    /// installed — never an error in that case.
    #[tauri::command]
    #[specta::specta]
    pub async fn list_obsidian_vaults() -> Result<Vec<ObsidianVault>, String> {
        crate::obsidian::detect_vaults().map_err(|e| e.to_string())
    }

    /// Returns today's daily note (or `date`'s, `YYYY-MM-DD`),
    /// creating the file from the default template on first use.
    /// Idempotent — the same day always resolves to the same `Note`.
    #[tauri::command]
    #[specta::specta]
    pub async fn get_or_create_daily_note(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        date: Option<String>,
    ) -> Result<Note, String> {
        let state = state.lock().await;
        state
            .storage
            .get_or_create_daily_note(date.as_deref())
            .await
            .map_err(|e| e.to_string())
    }

    /// Notes that `[[…]]`-link to this one. Match is resolved
    /// against the target's current title and filename stem, so
    /// renames don't orphan backlinks (spec 0013).
    #[tauri::command]
    #[specta::specta]
    pub async fn get_backlinks(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
        id: Uuid,
    ) -> Result<Vec<Note>, String> {
        let state = state.lock().await;
        state.storage.backlinks(id).await.map_err(|e| e.to_string())
    }

    /// Wipe the notes index and rebuild it by walking the current
    /// vault. Filesystem stays authoritative — the command makes
    /// the invariant operational for the "adopt an Obsidian vault"
    /// flow (spec 0037) and for disaster recovery when `index.db`
    /// is lost (spec 0005 acceptance).
    #[tauri::command]
    #[specta::specta]
    pub async fn rebuild_from_vault(
        state: tauri::State<'_, Arc<Mutex<AppState>>>,
    ) -> Result<RebuildStats, String> {
        let state = state.lock().await;
        state
            .storage
            .rebuild_from_vault()
            .await
            .map_err(|e| e.to_string())
    }
}
