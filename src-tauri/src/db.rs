//! SQLite + FTS5 layer. Index only; the filesystem is canonical.
//!
//! If `index.db` is deleted, it can be rebuilt from the vault's
//! `.md` files — see `rebuild_from_vault()`.

use std::path::Path;
use std::sync::Mutex;

use anyhow::Result;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use shared::*;
use uuid::Uuid;

pub struct Db {
    conn: Mutex<Connection>,
}

impl Db {
    pub fn open(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        Self::migrate(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn migrate(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS notes (
                id          TEXT PRIMARY KEY,
                path        TEXT NOT NULL UNIQUE,
                title       TEXT NOT NULL,
                tags_json   TEXT NOT NULL DEFAULT '[]',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                id UNINDEXED,
                title,
                body,
                tokenize = 'unicode61 remove_diacritics 2'
            );

            CREATE TABLE IF NOT EXISTS meetings (
                id                 TEXT PRIMARY KEY,
                title              TEXT NOT NULL,
                started_at         TEXT NOT NULL,
                ended_at           TEXT,
                duration_seconds   INTEGER,
                participants_json  TEXT NOT NULL DEFAULT '[]',
                recording_path     TEXT,
                has_transcript     INTEGER NOT NULL DEFAULT 0,
                has_summary        INTEGER NOT NULL DEFAULT 0,
                source_app         TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_notes_updated
                ON notes(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_meetings_started
                ON meetings(started_at DESC);
            "#,
        )?;
        Ok(())
    }

    // ---- Notes ----

    pub fn upsert_note(&self, note: &Note, body: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let tags_json = serde_json::to_string(&note.tags)?;
        conn.execute(
            "INSERT INTO notes (id, path, title, tags_json, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
                path       = excluded.path,
                title      = excluded.title,
                tags_json  = excluded.tags_json,
                updated_at = excluded.updated_at",
            params![
                note.id.to_string(),
                note.path,
                note.title,
                tags_json,
                note.created_at.to_rfc3339(),
                note.updated_at.to_rfc3339(),
            ],
        )?;

        // FTS: delete + insert (simpler than upsert)
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![note.id.to_string()])?;
        conn.execute(
            "INSERT INTO notes_fts (id, title, body) VALUES (?1, ?2, ?3)",
            params![note.id.to_string(), note.title, body],
        )?;
        Ok(())
    }

    pub fn delete_note(&self, id: Uuid) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let id_s = id.to_string();
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id_s])?;
        conn.execute("DELETE FROM notes_fts WHERE id = ?1", params![id_s])?;
        Ok(())
    }

    pub fn list_notes(&self) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, title, tags_json, created_at, updated_at
             FROM notes
             ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map([], row_to_note)?;
        rows.collect::<Result<_, _>>().map_err(Into::into)
    }

    pub fn get_note(&self, id: Uuid) -> Result<Option<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, title, tags_json, created_at, updated_at
             FROM notes WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id.to_string()], row_to_note)?;
        match rows.next() {
            Some(r) => Ok(Some(r?)),
            None => Ok(None),
        }
    }

    pub fn search_notes(&self, query: &str) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let q = format!("\"{}\"", query.replace('"', ""));
        let mut stmt = conn.prepare(
            "SELECT n.id, n.path, n.title, n.tags_json, n.created_at, n.updated_at
             FROM notes_fts f
             JOIN notes n ON n.id = f.id
             WHERE notes_fts MATCH ?1
             ORDER BY rank",
        )?;
        let rows = stmt.query_map(params![q], row_to_note)?;
        rows.collect::<Result<_, _>>().map_err(Into::into)
    }

    // ---- Meetings ----

    pub fn upsert_meeting(&self, m: &Meeting) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO meetings
                (id, title, started_at, ended_at, duration_seconds,
                 participants_json, recording_path, has_transcript, has_summary, source_app)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                ended_at = excluded.ended_at,
                duration_seconds = excluded.duration_seconds,
                participants_json = excluded.participants_json,
                recording_path = excluded.recording_path,
                has_transcript = excluded.has_transcript,
                has_summary = excluded.has_summary,
                source_app = excluded.source_app",
            params![
                m.id.to_string(),
                m.title,
                m.started_at.to_rfc3339(),
                m.ended_at.map(|d| d.to_rfc3339()),
                m.duration_seconds,
                serde_json::to_string(&m.participants)?,
                m.recording_path,
                m.has_transcript as i32,
                m.has_summary as i32,
                m.source_app,
            ],
        )?;
        Ok(())
    }

    pub fn list_meetings(&self) -> Result<Vec<Meeting>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, started_at, ended_at, duration_seconds,
                    participants_json, recording_path, has_transcript, has_summary, source_app
             FROM meetings
             ORDER BY started_at DESC",
        )?;
        let rows = stmt.query_map([], row_to_meeting)?;
        rows.collect::<Result<_, _>>().map_err(Into::into)
    }

    pub fn get_meeting(&self, id: Uuid) -> Result<Option<Meeting>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, started_at, ended_at, duration_seconds,
                    participants_json, recording_path, has_transcript, has_summary, source_app
             FROM meetings WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id.to_string()], row_to_meeting)?;
        match rows.next() {
            Some(r) => Ok(Some(r?)),
            None => Ok(None),
        }
    }
}

fn row_to_note(r: &rusqlite::Row) -> rusqlite::Result<Note> {
    let id: String = r.get(0)?;
    let created_at: String = r.get(4)?;
    let updated_at: String = r.get(5)?;
    let tags_json: String = r.get(3)?;
    Ok(Note {
        id: Uuid::parse_str(&id).map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?,
        path: r.get(1)?,
        title: r.get(2)?,
        tags: serde_json::from_str(&tags_json).unwrap_or_default(),
        created_at: parse_dt(&created_at),
        updated_at: parse_dt(&updated_at),
    })
}

fn row_to_meeting(r: &rusqlite::Row) -> rusqlite::Result<Meeting> {
    let id: String = r.get(0)?;
    let started_at: String = r.get(2)?;
    let ended_at: Option<String> = r.get(3)?;
    let participants_json: String = r.get(5)?;
    let has_transcript: i32 = r.get(7)?;
    let has_summary: i32 = r.get(8)?;

    Ok(Meeting {
        id: Uuid::parse_str(&id).map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?,
        title: r.get(1)?,
        started_at: parse_dt(&started_at),
        ended_at: ended_at.map(|s| parse_dt(&s)),
        duration_seconds: r.get(4)?,
        participants: serde_json::from_str(&participants_json).unwrap_or_default(),
        recording_path: r.get(6)?,
        has_transcript: has_transcript != 0,
        has_summary: has_summary != 0,
        source_app: r.get(9)?,
    })
}

fn parse_dt(s: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}
