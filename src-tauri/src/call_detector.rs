//! Ongoing-call detector.
//!
//! An async loop queries Windows audio sessions via COM
//! (`IAudioSessionManager2` + `IAudioSessionControl2`). For each
//! session in `AudioSessionStateActive`, resolve the owner process
//! and flag it as "call detected" if it matches a known list.
//!
//! F1 TODO:
//! - [ ] COM enumeration via the `windows` crate
//! - [ ] Cache of PIDs already seen to avoid spam
//! - [ ] Process name → app label map (e.g. `ms-teams.exe` → Teams)
//! - [ ] Browser handling (Chrome/Edge → Meet, Webex, Slack call)

use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use shared::*;
use tauri::{AppHandle, Manager};
use tauri_specta::Event;
use tokio::sync::Mutex;

use crate::config::AppState;
use crate::events::CallDetected;

/// Known call-capable apps. Case-insensitive match on executable name.
const KNOWN_CALL_APPS: &[(&str, &str)] = &[
    ("ms-teams.exe", "Microsoft Teams"),
    ("teams.exe", "Microsoft Teams"),
    ("zoom.exe", "Zoom"),
    ("webex.exe", "Webex"),
    ("discord.exe", "Discord"),
    ("slack.exe", "Slack"),
    // Browsers: hard to tell when it's actually a call; leave out for now.
    // ("chrome.exe", "Browser (Google Meet?)"),
    // ("msedge.exe", "Browser (Teams Web?)"),
];

pub async fn run_loop(app: AppHandle) -> Result<()> {
    let mut seen: HashSet<u32> = HashSet::new();
    let mut tick = tokio::time::interval(Duration::from_secs(3));

    loop {
        tick.tick().await;

        let active = poll_active_calls().await.unwrap_or_default();

        for call in &active {
            if seen.insert(call.pid) {
                tracing::info!("Call detected: {} ({})", call.app_name, call.process_name);
                let _ = CallDetected {
                    app_name: call.app_name.clone(),
                    process_name: call.process_name.clone(),
                }
                .emit(&app);
            }
        }

        // Only touch state when the set of active calls actually changed —
        // otherwise we'd wake up anyone observing the mutex every 3s for nothing.
        if let Some(state) = app.try_state::<Arc<Mutex<AppState>>>() {
            let mut st = state.lock().await;
            if st.active_calls != active {
                st.active_calls = active;
            }
            seen.retain(|pid| st.active_calls.iter().any(|c| c.pid == *pid));
        }
    }
}

#[cfg(target_os = "windows")]
async fn poll_active_calls() -> Result<Vec<ActiveCall>> {
    // TODO: implement via the `windows` crate.
    // Sketch of what's needed:
    //
    // use windows::Win32::Media::Audio::*;
    // use windows::Win32::System::Com::*;
    //
    // CoInitializeEx(...)?;
    // let enumerator: IMMDeviceEnumerator = CoCreateInstance(...)?;
    // let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
    // let sessions: IAudioSessionManager2 = device.Activate(...)?;
    // let session_enum = sessions.GetSessionEnumerator()?;
    // for i in 0..session_enum.GetCount()? {
    //     let session: IAudioSessionControl2 = ...;
    //     let state = session.GetState()?;
    //     if state != AudioSessionStateActive { continue; }
    //     let pid = session.GetProcessId()?;
    //     let process_name = resolve_process_name(pid)?;
    //     if matches_known_app(&process_name) { ... }
    // }
    Ok(Vec::new())
}

#[cfg(not(target_os = "windows"))]
async fn poll_active_calls() -> Result<Vec<ActiveCall>> {
    // Stub for dev outside Windows
    Ok(Vec::new())
}

#[allow(dead_code)]
fn match_known_app(process_name: &str) -> Option<&'static str> {
    let lowered = process_name.to_lowercase();
    KNOWN_CALL_APPS
        .iter()
        .find(|(exe, _)| lowered == *exe)
        .map(|(_, name)| *name)
}
