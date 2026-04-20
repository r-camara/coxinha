//! Latency of the "Ctrl+Alt+N → cursor in editor" flow.
//!
//! Full path crosses five boundaries:
//!   1. OS → global_shortcut plugin
//!   2. `shortcuts::handle_shortcut` → `Navigate.emit`
//!   3. IPC Rust→WebView → `events.navigate.listen`
//!   4. `invoke('create_note')` → `commands::create_note`
//!   5. `invoke('get_note')` → Suspense resolve → `editor.focus()`
//!
//! This test covers the backend slice that's measurable without a
//! WebView (steps tied to Storage). The rest — OS dispatch, IPC
//! serialize, WebView render — gets measured from the frontend via
//! `performance.mark` (see `src/lib/perf.ts`, logs in DevTools).
//!
//! UX budget for the full flow is 2 s. Budget asserted here is
//! 50 ms per storage call — above that there's no way the full flow
//! fits 2 s once you add the 500–800 ms typical WebView cost.

use std::path::PathBuf;
use std::time::Instant;

#[tokio::test]
async fn new_note_backend_latency_fits_budget() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let vault: PathBuf = tmp.path().into();

    coxinha_lib::perf_helpers::fresh_vault(&vault);
    let db_path = vault.join(".coxinha").join("index.db");
    let db = std::sync::Arc::new(coxinha_lib::perf_helpers::open_db(&db_path));
    let storage = coxinha_lib::perf_helpers::storage(vault.clone(), db.clone());

    // First create pays SQLite page-cache warm-up; discard it.
    let _ = storage.create_note("", "").await.expect("warm-up create");

    let mut create_samples = Vec::with_capacity(10);
    let mut get_samples = Vec::with_capacity(10);

    for _ in 0..10 {
        let t0 = Instant::now();
        let note = storage.create_note("", "").await.expect("create");
        create_samples.push(t0.elapsed());

        let t1 = Instant::now();
        let _content = storage.get_note(note.id).await.expect("get");
        get_samples.push(t1.elapsed());
    }

    let create_avg: u128 =
        create_samples.iter().map(|d| d.as_micros()).sum::<u128>() / create_samples.len() as u128;
    let create_max = create_samples.iter().max().unwrap();
    let get_avg: u128 =
        get_samples.iter().map(|d| d.as_micros()).sum::<u128>() / get_samples.len() as u128;
    let get_max = get_samples.iter().max().unwrap();

    println!(
        "new-note backend latency: create avg={}µs max={:?} | get avg={}µs max={:?}",
        create_avg, create_max, get_avg, get_max
    );

    assert!(
        *create_max < std::time::Duration::from_millis(50),
        "create_note max {:?} exceeded the 50ms budget",
        create_max
    );
    assert!(
        *get_max < std::time::Duration::from_millis(50),
        "get_note max {:?} exceeded the 50ms budget",
        get_max
    );
}
