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
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::window::show_main;

/// Frontend routes reachable via a global shortcut.
const ROUTE_NEW_NOTE: &str = "/notes/new";
const ROUTE_OPEN_APP: &str = "/";
const ROUTE_AGENDA: &str = "/agenda";
const ROUTE_MEETINGS: &str = "/meetings";
const ROUTE_TOGGLE_RECORDING: &str = "/actions/toggle-recording";

/// Shortcut → frontend route, populated at `register_all`. Used by
/// `handle_shortcut` to resolve a press without string-matching the
/// `Shortcut`'s Debug output.
static ROUTES: OnceLock<Mutex<HashMap<Shortcut, &'static str>>> = OnceLock::new();

pub fn register_all(app: &AppHandle, cfg: &ShortcutsConfig) -> Result<()> {
    let gs = app.global_shortcut();
    let mut routes = routes_lock().lock().unwrap();
    routes.clear();

    for (raw, route) in [
        (&cfg.new_note, ROUTE_NEW_NOTE),
        (&cfg.open_app, ROUTE_OPEN_APP),
        (&cfg.agenda, ROUTE_AGENDA),
        (&cfg.meetings, ROUTE_MEETINGS),
        (&cfg.toggle_recording, ROUTE_TOGGLE_RECORDING),
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
        routes.get(shortcut).copied().unwrap_or("/")
    };
    tracing::info!("shortcut {} -> {}", shortcut, route);

    show_main(app);
    let _ = app.emit("navigate", route);
}

fn routes_lock() -> &'static Mutex<HashMap<Shortcut, &'static str>> {
    ROUTES.get_or_init(|| Mutex::new(HashMap::new()))
}
