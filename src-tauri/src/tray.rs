//! System tray icon + menu.

use anyhow::Result;
use rust_i18n::t;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};
use tauri_specta::Event;

use crate::events::{BeforeQuit, Navigate, Route};
use crate::window::show_main;

/// Janela entre emitir `BeforeQuit` e chamar `app.exit(0)`. Escolhido
/// pra cobrir o debounce de 500 ms do editor + ~100 ms de IPC
/// round-trip. Maior que isso vira fricção ("por que o Quit demora?"),
/// menor corre risco de perder a última batida.
const QUIT_GRACE: std::time::Duration = std::time::Duration::from_millis(600);

pub fn setup(app: &AppHandle) -> Result<()> {
    let open_item = MenuItem::with_id(app, "open", t!("tray.open"), true, None::<&str>)?;
    let new_note_item = MenuItem::with_id(app, "new-note", t!("tray.newNote"), true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let settings_item =
        MenuItem::with_id(app, "settings", t!("tray.settings"), true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", t!("tray.quit"), true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&open_item, &new_note_item, &sep, &settings_item, &quit_item],
    )?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "new-note" => {
                show_main(app);
                let _ = Navigate {
                    route: Route::NotesNew,
                }
                .emit(app);
            }
            "settings" => {
                show_main(app);
                let _ = Navigate {
                    route: Route::Settings,
                }
                .emit(app);
            }
            "quit" => request_graceful_quit(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// Avisa o frontend (editor com debounce, futuros drafts) e só
/// chama `app.exit(0)` depois de `QUIT_GRACE`. Logs pra deixar
/// explícito no tracing se alguma coisa demorar demais.
fn request_graceful_quit(app: &AppHandle) {
    if let Err(e) = BeforeQuit.emit(app) {
        tracing::warn!("BeforeQuit emit failed: {e}");
    }
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(QUIT_GRACE).await;
        tracing::info!("graceful quit window elapsed, exiting");
        handle.exit(0);
    });
}
