//! Latência do fluxo "Ctrl+Alt+N → cursor no editor".
//!
//! O fluxo completo atravessa cinco limites:
//!   1. OS → global_shortcut plugin (pressed)
//!   2. `shortcuts::handle_shortcut` → `Navigate.emit`
//!   3. IPC Rust→WebView → `events.navigate.listen`
//!   4. `invoke('create_note')` → Rust `commands::create_note`
//!   5. `invoke('get_note')` → Suspense resolve → `editor.focus()`
//!
//! Esse teste mede **só a parte backend medível sem WebView2**:
//!   - tempo de `create_note` (escreve arquivo, upsert no DB, parse
//!     wiki-links, extrai tags)
//!   - tempo de `get_note` (lê o arquivo do disco, devolve NoteContent)
//!
//! As frações OS→plugin→emit e WebView render são medidas no
//! frontend via `performance.mark` (logs no console do DevTools).
//!
//! O budget é **time-to-type** total ≤ 2 s (requisito de UX).
//! Aqui defendemos só a parte Rust: create + get ≤ 50 ms a cada,
//! porque qualquer coisa acima disso torna impossível atingir o
//! budget total quando somado aos outros hops (shortcut → emit:
//! ~5 ms, IPC: ~10 ms, WebView render + BlockNote init: ~500-800
//! ms). Se este teste começar a passar dos 50 ms por chamada, a
//! regressão veio daqui — não da UI.

use std::path::PathBuf;
use std::time::Instant;

#[tokio::test]
async fn new_note_backend_latency_fits_budget() {
    // Monta storage contra um vault tmp — mesma superfície que
    // `AppState::initialize` usa, sem o custo de construir o
    // `AppHandle` do Tauri.
    let tmp = tempfile::tempdir().expect("tempdir");
    let vault: PathBuf = tmp.path().into();

    for sub in &["notes", "meetings", "attachments", "daily"] {
        std::fs::create_dir_all(vault.join(sub)).unwrap();
    }

    let db_path = vault.join(".coxinha").join("index.db");
    std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
    let db = std::sync::Arc::new(coxinha_lib::perf_helpers::open_db(&db_path));
    let storage = coxinha_lib::perf_helpers::storage(vault.clone(), db.clone());

    // Warm-up: primeira criação inclui one-shot de init do connection
    // pool / page cache do SQLite. Descartamos.
    let _ = storage.create_note("", "").await.expect("warm-up create");

    // Amostra 10 runs, reporta média e pior caso. O pior caso é o
    // que importa na latência percebida.
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

    // Budget: 50 ms por chamada no pior caso.
    // Se isso quebrar, o culpado quase sempre é novo I/O bloqueante
    // que entrou no path (novo parser, nova escrita colateral, etc.).
    assert!(
        *create_max < std::time::Duration::from_millis(50),
        "create_note max {:?} ultrapassou o budget de 50ms",
        create_max
    );
    assert!(
        *get_max < std::time::Duration::from_millis(50),
        "get_note max {:?} ultrapassou o budget de 50ms",
        get_max
    );
}
