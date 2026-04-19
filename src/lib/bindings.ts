/**
 * Generated automatically by `tauri-specta` in dev mode.
 *
 * Do not edit by hand — this file is overwritten on the next
 * `pnpm tauri dev` run. On the first dev run the stub below is
 * replaced by real types derived from the Rust commands.
 */

// Temporary stub. Replaced automatically on first run.
export type Note = {
  id: string;
  title: string;
  path: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type NoteContent = {
  note: Note;
  markdown: string;
};

export type Meeting = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  participants: string[];
  recording_path: string | null;
  has_transcript: boolean;
  has_summary: boolean;
  source_app: string | null;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  speaker: string | null;
  confidence: number | null;
};

export type Transcript = {
  meeting_id: string;
  language: string | null;
  segments: TranscriptSegment[];
};

export type CallDetected = {
  app_name: string;
  process_name: string;
};
