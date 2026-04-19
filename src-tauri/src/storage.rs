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

        fs::write(&abs_path, content).await?;

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
        fs::write(&abs, content).await?;

        let updated = Note {
            title: first_heading(content).unwrap_or(note.title),
            tags: extract_tags(content),
            updated_at: Utc::now(),
            ..note
        };
        self.db.upsert_note(&updated, content)?;
        Ok(updated)
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
