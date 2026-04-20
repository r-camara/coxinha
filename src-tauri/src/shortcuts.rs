//! Global shortcuts. Registered at startup, live for the app's lifetime.
//!
//! Each shortcut reveals the window and navigates to a specific route.
//!
//! The same `ShortcutsConfig` used for registration is stored inside a
//! `ShortcutRoutes` map that the handler looks up at press time — no
//! fragile Debug-string matching, and no runtime coupling to `AppState`.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

use anyhow::Result;
use shared::ShortcutsConfig;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_specta::Event;

use crate::events::{Navigate, Route};
use crate::window::show_main;

/// Shortcut → Route, populated at `register_all`. Used by
/// `handle_shortcut` to resolve a press without string-matching the
/// `Shortcut`'s Debug output.
static ROUTES: OnceLock<Mutex<HashMap<Shortcut, Route>>> = OnceLock::new();

pub fn register_all(app: &AppHandle, cfg: &ShortcutsConfig) -> Result<()> {
    let gs = app.global_shortcut();
    let mut routes = routes_lock().lock().unwrap();
    routes.clear();

    for (raw, route) in [
        (&cfg.new_note, Route::NotesNew),
        (&cfg.open_app, Route::Home),
        (&cfg.agenda, Route::Agenda),
        (&cfg.meetings, Route::Meetings),
        (&cfg.toggle_recording, Route::ToggleRecording),
    ] {
        match raw.parse::<Shortcut>() {
            Ok(shortcut) => {
                if let Err(e) = gs.register(shortcut) {
                    tracing::warn!("failed to register {}: {:?}", raw, e);
                    continue;
                }
                routes.insert(shortcut, route);
            }
            Err(e) => tracing::warn!("invalid shortcut '{}': {:?}", raw, e),
        }
    }
    Ok(())
}

pub fn handle_shortcut(
    app: &AppHandle,
    shortcut: &Shortcut,
    event: tauri_plugin_global_shortcut::ShortcutEvent,
) {
    if event.state() != ShortcutState::Pressed {
        return;
    }

    let route = {
        let routes = routes_lock().lock().unwrap();
        routes.get(shortcut).copied().unwrap_or(Route::Home)
    };
    tracing::info!("shortcut {} -> {:?}", shortcut, route);

    show_main(app);
    let _ = Navigate { route }.emit(app);
}

fn routes_lock() -> &'static Mutex<HashMap<Shortcut, Route>> {
    ROUTES.get_or_init(|| Mutex::new(HashMap::new()))
}

#[cfg(test)]
mod tests {
    use shared::ShortcutsConfig;
    use tauri_plugin_global_shortcut::Shortcut;

    #[test]
    fn default_shortcuts_parse() {
        // Guards spec 0042: the Ctrl+Alt+Shift+* defaults must
        // parse into valid Shortcut values so the app doesn't
        // boot with a broken global-shortcut registration.
        let cfg = ShortcutsConfig::default();
        for raw in [
            &cfg.new_note,
            &cfg.open_app,
            &cfg.agenda,
            &cfg.meetings,
            &cfg.toggle_recording,
        ] {
            raw.parse::<Shortcut>()
                .unwrap_or_else(|e| panic!("failed to parse default shortcut {raw:?}: {e:?}"));
        }
    }

    #[test]
    fn default_shortcuts_all_use_shift() {
        // Guards against a partial downgrade — every default must
        // carry Shift to stay out of the Office 365 / OneNote
        // conflict zone on Windows (spec 0042).
        let cfg = ShortcutsConfig::default();
        for raw in [
            &cfg.new_note,
            &cfg.open_app,
            &cfg.agenda,
            &cfg.meetings,
            &cfg.toggle_recording,
        ] {
            assert!(
                raw.to_ascii_lowercase().contains("shift"),
                "default shortcut {raw:?} missing Shift modifier"
            );
        }
    }
}
