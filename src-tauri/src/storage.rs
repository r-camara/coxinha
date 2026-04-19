//! Vault abstraction. The filesystem is canonical; the DB is an index.
//!
//! Rules:
//! - Each note becomes an `.md` file under `notes/`
//! - Filename = title slug + `-<short id>`
//! - Attachments under `attachments/` (auto WebP compression on paste)
//! - Meetings under `meetings/<id>/` with metadata.json, recording.wav, ...

use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{Context, Result};
use chrono::Utc;
use image::ImageFormat;
use shared::*;
use tokio::fs;
use uuid::Uuid;

use crate::db::Db;

pub struct Storage {
    vault: PathBuf,
    db: Arc<Db>,
}

impl Storage {
    pub fn new(vault: PathBuf, db: Arc<Db>) -> Self {
        Self { vault, db }
    }

    /// Needed by spec 0015 (vault import) and spec 0018 (external
    /// edit conflicts) — both walk the vault path directly.
    #[allow(dead_code)]
    pub fn vault(&self) -> &Path {
        &self.vault
    }

    // ---- Notes ----

    pub async fn create_note(&self, title: &str, content: &str) -> Result<Note> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let filename = format!(
            "{}-{}.md",
            slug(title),
            id.simple().to_string().chars().take(6).collect::<String>()
        );
        let rel_path = format!("notes/{}", filename);
        let abs_path = self.vault.join(&rel_path);

        atomic_write(&abs_path, content.as_bytes()).await?;

        let note = Note {
            id,
            title: title.to_string(),
            path: rel_path,
            tags: extract_tags(content),
            created_at: now,
            updated_at: now,
        };
        self.db.upsert_note(&note, content)?;
        Ok(note)
    }

    pub async fn update_note(&self, id: Uuid, content: &str) -> Result<Note> {
        let note = self
            .db
            .get_note(id)?
            .with_context(|| format!("note {} not found", id))?;
        let abs = self.vault.join(&note.path);
        atomic_write(&abs, content.as_bytes()).await?;

        let updated = Note {
            title: first_heading(content).unwrap_or(note.title),
            tags: extract_tags(content),
            updated_at: Utc::now(),
            ..note
        };
        self.db.upsert_note(&updated, content)?;
        Ok(updated)
    }

    /// Returns today's (or `date`'s) daily note, creating the file
    /// from the default template on first use. Idempotent — a second
    /// call on the same day returns the same `Note` without
    /// rewriting the file.
    pub async fn get_or_create_daily_note(&self, date: Option<&str>) -> Result<Note> {
        let date_str: String = match date {
            Some(d) => {
                chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d")
                    .with_context(|| format!("invalid date '{}', expected YYYY-MM-DD", d))?;
                d.to_string()
            }
            None => chrono::Local::now().format("%Y-%m-%d").to_string(),
        };

        let rel_path = format!("daily/{}.md", date_str);
        if let Some(existing) = self.db.get_note_by_path(&rel_path)? {
            return Ok(existing);
        }

        let abs_path = self.vault.join(&rel_path);
        let content = format!("# {}\n\n## Notes\n\n", date_str);
        atomic_write(&abs_path, content.as_bytes()).await?;

        let now = Utc::now();
        let note = Note {
            id: Uuid::new_v4(),
            title: date_str,
            path: rel_path,
            tags: Vec::new(),
            created_at: now,
            updated_at: now,
        };
        self.db.upsert_note(&note, &content)?;
        Ok(note)
    }

    pub async fn delete_note(&self, id: Uuid) -> Result<()> {
        if let Some(note) = self.db.get_note(id)? {
            let abs = self.vault.join(&note.path);
            match fs::remove_file(&abs).await {
                Ok(()) => {}
                Err(e) if e.kind() == io::ErrorKind::NotFound => {}
                Err(e) => return Err(e.into()),
            }
        }
        self.db.delete_note(id)?;
        Ok(())
    }

    pub async fn list_notes(&self) -> Result<Vec<Note>> {
        self.db.list_notes()
    }

    pub async fn get_note(&self, id: Uuid) -> Result<NoteContent> {
        let note = self
            .db
            .get_note(id)?
            .with_context(|| format!("note {} not found", id))?;
        let markdown = fs::read_to_string(self.vault.join(&note.path)).await?;
        Ok(NoteContent { note, markdown })
    }

    pub async fn search_notes(&self, query: &str) -> Result<Vec<Note>> {
        self.db.search_notes(query)
    }

    // ---- Meetings ----

    pub async fn list_meetings(&self) -> Result<Vec<Meeting>> {
        self.db.list_meetings()
    }

    pub async fn get_meeting(&self, id: Uuid) -> Result<Meeting> {
        self.db
            .get_meeting(id)?
            .with_context(|| format!("meeting {} not found", id))
    }

    pub fn meeting_dir(&self, id: Uuid) -> PathBuf {
        self.vault.join("meetings").join(id.to_string())
    }

    // ---- Attachments ----

    pub async fn save_attachment(&self, filename: &str, bytes: &[u8]) -> Result<String> {
        let (final_bytes, final_name) = compress_if_image(filename, bytes);

        let stamp = Utc::now().format("%Y-%m-%d-%H%M%S");
        let safe_name = format!("{}-{}", stamp, sanitize(&final_name));
        let rel = format!("attachments/{}", safe_name);
        let abs = self.vault.join(&rel);
        fs::write(&abs, &final_bytes).await?;
        Ok(rel)
    }
}

/// Write `content` to `abs` via `<abs>.coxinha-tmp` + rename so a
/// crash mid-write leaves either the old contents or the new
/// contents — never a truncated file.
///
/// Windows' `MoveFileExW(..., MOVEFILE_REPLACE_EXISTING)` backs
/// `std::fs::rename`, so the replace-on-exists case is atomic on
/// NTFS. Requires `tmp` and `abs` on the same filesystem; our vault
/// structure guarantees that.
async fn atomic_write(abs: &Path, content: &[u8]) -> Result<()> {
    let tmp = {
        let name = abs
            .file_name()
            .with_context(|| format!("no file name in {}", abs.display()))?
            .to_string_lossy()
            .into_owned();
        let mut t = abs.to_path_buf();
        t.set_file_name(format!("{}.coxinha-tmp", name));
        t
    };
    fs::write(&tmp, content).await?;
    fs::rename(&tmp, abs).await?;
    Ok(())
}

/// Try to shrink/convert an image to WebP. Fallback = original bytes.
fn compress_if_image(filename: &str, bytes: &[u8]) -> (Vec<u8>, String) {
    if !is_image(filename) {
        return (bytes.to_vec(), filename.to_string());
    }

    let Ok(img) = image::load_from_memory(bytes) else {
        return (bytes.to_vec(), filename.to_string());
    };

    const MAX_WIDTH: u32 = 1600;
    let resized = if img.width() > MAX_WIDTH {
        let ratio = MAX_WIDTH as f32 / img.width() as f32;
        let new_height = (img.height() as f32 * ratio) as u32;
        img.resize(MAX_WIDTH, new_height, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };

    let mut out: Vec<u8> = Vec::new();
    let encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut out);
    if resized.write_with_encoder(encoder).is_ok() {
        let new_name = Path::new(filename)
            .with_extension("webp")
            .to_string_lossy()
            .into_owned();
        return (out, new_name);
    }

    (bytes.to_vec(), filename.to_string())
}

fn is_image(filename: &str) -> bool {
    matches!(
        ImageFormat::from_path(filename),
        Ok(ImageFormat::Png
            | ImageFormat::Jpeg
            | ImageFormat::Gif
            | ImageFormat::Bmp
            | ImageFormat::WebP
            | ImageFormat::Tiff)
    )
}

fn slug(s: &str) -> String {
    let lower = s.to_lowercase();
    let replaced: String = lower
        .chars()
        .map(|c| {
            if c.is_alphanumeric() {
                c
            } else if c.is_whitespace() || c == '-' || c == '_' {
                '-'
            } else {
                '-'
            }
        })
        .collect();
    // Collapse repeated '-'
    let mut out = String::new();
    let mut prev = '_';
    for c in replaced.chars() {
        if c == '-' && prev == '-' {
            continue;
        }
        out.push(c);
        prev = c;
    }
    let trimmed = out.trim_matches('-').to_string();
    if trimmed.is_empty() {
        "note".into()
    } else {
        trimmed.chars().take(60).collect()
    }
}

fn sanitize(s: &str) -> String {
    s.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn extract_tags(markdown: &str) -> Vec<String> {
    let mut tags = Vec::new();
    for word in markdown.split_whitespace() {
        if let Some(rest) = word.strip_prefix('#') {
            if !rest.is_empty() && rest.chars().next().map_or(false, |c| c.is_alphabetic()) {
                let clean: String = rest
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
                    .collect();
                if !clean.is_empty() && !tags.contains(&clean) {
                    tags.push(clean);
                }
            }
        }
    }
    tags
}

fn first_heading(markdown: &str) -> Option<String> {
    for line in markdown.lines() {
        let trimmed = line.trim_start();
        if let Some(rest) = trimmed.strip_prefix('#') {
            let title = rest.trim_start_matches('#').trim();
            if !title.is_empty() {
                return Some(title.to_string());
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slug_lowercases_and_hyphenates() {
        assert_eq!(slug("Hello World"), "hello-world");
        assert_eq!(slug("  spaced   out  "), "spaced-out");
        assert_eq!(slug("Daily Notes / 2026-04-18"), "daily-notes-2026-04-18");
    }

    #[test]
    fn slug_falls_back_when_empty() {
        assert_eq!(slug(""), "note");
        assert_eq!(slug("!!!"), "note");
        assert_eq!(slug("   "), "note");
    }

    #[test]
    fn slug_truncates_long_titles() {
        let long = "a".repeat(200);
        assert!(slug(&long).len() <= 60);
    }

    #[test]
    fn extract_tags_finds_alpha_hashtags() {
        let tags = extract_tags("meeting #work and #personal notes");
        assert_eq!(tags, vec!["work", "personal"]);
    }

    #[test]
    fn extract_tags_deduplicates_preserving_order() {
        let tags = extract_tags("#alpha #beta #alpha #gamma");
        assert_eq!(tags, vec!["alpha", "beta", "gamma"]);
    }

    #[test]
    fn extract_tags_rejects_numeric_and_empty() {
        let tags = extract_tags("#123 #_foo # #real");
        assert_eq!(tags, vec!["real"]);
    }

    #[test]
    fn first_heading_reads_h1_and_h2() {
        assert_eq!(first_heading("# Title\n\nbody").as_deref(), Some("Title"));
        assert_eq!(
            first_heading("## Subsection\n").as_deref(),
            Some("Subsection")
        );
    }

    #[test]
    fn first_heading_returns_none_without_heading() {
        assert_eq!(first_heading("plain paragraph"), None);
        assert_eq!(first_heading(""), None);
    }

    #[test]
    fn sanitize_keeps_safe_chars_only() {
        assert_eq!(sanitize("file name.png"), "file_name.png");
        assert_eq!(sanitize("weird/name:with*chars"), "weird_name_with_chars");
        assert_eq!(sanitize("kept-1_2.ext"), "kept-1_2.ext");
    }

    // --- Integration: Storage against a temp vault + fresh DB ---

    async fn fresh_storage() -> (tempfile::TempDir, Storage) {
        let dir = tempfile::tempdir().expect("tempdir");
        for sub in &["notes", "meetings", "attachments"] {
            tokio::fs::create_dir_all(dir.path().join(sub))
                .await
                .expect("mkdir subdir");
        }
        let db = Arc::new(Db::open(&dir.path().join("index.db")).expect("open db"));
        let storage = Storage::new(dir.path().to_path_buf(), db);
        (dir, storage)
    }

    #[tokio::test]
    async fn create_note_writes_file_and_indexes() {
        let (tmp, storage) = fresh_storage().await;
        let body = "# My note\n\nhello #tag";
        let note = storage.create_note("My note", body).await.unwrap();

        let abs = tmp.path().join(&note.path);
        assert!(abs.exists(), "note file should exist at {:?}", abs);
        assert!(note.path.starts_with("notes/"));
        assert_eq!(note.tags, vec!["tag"]);

        let fetched = storage.get_note(note.id).await.unwrap();
        assert_eq!(fetched.markdown, body);
        assert_eq!(fetched.note.title, "My note");
    }

    #[tokio::test]
    async fn update_note_rewrites_file_and_retitles_from_first_heading() {
        let (_tmp, storage) = fresh_storage().await;
        let note = storage.create_note("Old", "# Old\n").await.unwrap();

        let updated = storage
            .update_note(note.id, "# Brand New\n\nbody")
            .await
            .unwrap();

        assert_eq!(updated.title, "Brand New");
        let fetched = storage.get_note(note.id).await.unwrap();
        assert_eq!(fetched.markdown, "# Brand New\n\nbody");
    }

    #[tokio::test]
    async fn delete_note_removes_file_and_db_entry() {
        let (tmp, storage) = fresh_storage().await;
        let note = storage.create_note("Bye", "# Bye\n").await.unwrap();
        let abs = tmp.path().join(&note.path);
        assert!(abs.exists());

        storage.delete_note(note.id).await.unwrap();

        assert!(!abs.exists(), "file should be removed");
        assert!(storage.list_notes().await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn delete_note_is_idempotent_when_file_missing() {
        let (tmp, storage) = fresh_storage().await;
        let note = storage.create_note("Ghost", "# Ghost\n").await.unwrap();
        // Remove the file behind the DB's back to simulate an external edit.
        tokio::fs::remove_file(tmp.path().join(&note.path))
            .await
            .unwrap();

        // Delete must still succeed and clear the index.
        storage.delete_note(note.id).await.unwrap();
        assert!(storage.list_notes().await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn atomic_write_leaves_no_tmp_behind() {
        let (tmp, storage) = fresh_storage().await;
        let note = storage.create_note("Probe", "# Probe\n").await.unwrap();
        let abs = tmp.path().join(&note.path);
        // No sibling `.coxinha-tmp` file should remain after a
        // successful write — the rename step consumes it.
        let stem = abs.file_name().unwrap().to_string_lossy().into_owned();
        let tmp_file = abs.with_file_name(format!("{}.coxinha-tmp", stem));
        assert!(!tmp_file.exists());
        assert!(abs.exists());
    }

    #[tokio::test]
    async fn daily_note_creates_file_with_template_on_first_call() {
        let (tmp, storage) = fresh_storage().await;
        tokio::fs::create_dir_all(tmp.path().join("daily"))
            .await
            .unwrap();

        let note = storage
            .get_or_create_daily_note(Some("2026-04-18"))
            .await
            .unwrap();

        assert_eq!(note.path, "daily/2026-04-18.md");
        assert_eq!(note.title, "2026-04-18");

        let markdown = tokio::fs::read_to_string(tmp.path().join(&note.path))
            .await
            .unwrap();
        assert!(markdown.starts_with("# 2026-04-18"));
        assert!(markdown.contains("## Notes"));
    }

    #[tokio::test]
    async fn daily_note_is_idempotent_for_same_date() {
        let (tmp, storage) = fresh_storage().await;
        tokio::fs::create_dir_all(tmp.path().join("daily"))
            .await
            .unwrap();

        let first = storage
            .get_or_create_daily_note(Some("2026-01-01"))
            .await
            .unwrap();
        // User types something; we persist it.
        storage
            .update_note(first.id, "# 2026-01-01\n\nmy thoughts\n")
            .await
            .unwrap();

        // Second call on the same day must return the *same* note
        // without overwriting user edits.
        let second = storage
            .get_or_create_daily_note(Some("2026-01-01"))
            .await
            .unwrap();
        assert_eq!(second.id, first.id);

        let content = tokio::fs::read_to_string(tmp.path().join(&second.path))
            .await
            .unwrap();
        assert!(content.contains("my thoughts"));
    }

    #[tokio::test]
    async fn daily_note_rejects_bad_date() {
        let (_tmp, storage) = fresh_storage().await;
        let err = storage
            .get_or_create_daily_note(Some("04/18/2026"))
            .await
            .unwrap_err();
        assert!(err.to_string().contains("invalid date"));
    }

    #[tokio::test]
    async fn daily_note_defaults_to_today_when_none() {
        let (tmp, storage) = fresh_storage().await;
        tokio::fs::create_dir_all(tmp.path().join("daily"))
            .await
            .unwrap();

        let note = storage.get_or_create_daily_note(None).await.unwrap();
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        assert_eq!(note.title, today);
        assert_eq!(note.path, format!("daily/{}.md", today));
    }
}
