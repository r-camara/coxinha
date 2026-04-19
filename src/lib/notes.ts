import type { Note } from './bindings';

/**
 * Order notes by `updated_at` DESC, newest first.
 * Exported so tests can pin the exact ordering behavior the UI
 * relies on — the sidebar assumes the first entry is the most
 * recently touched note.
 */
export function sortByUpdated(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
