import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

import type { Note } from './bindings';
import { sortByUpdated } from './notes';
import { mark } from './perf';

interface AppStore {
  notes: Note[];
  activeNoteId: string | null;

  loadNotes: () => Promise<void>;
  setActiveNote: (id: string | null) => void;
  newNote: () => Promise<void>;
  saveNote: (id: string, markdown: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<Note[]>;
  openDailyNote: (date?: string) => Promise<Note>;
}

export const useAppStore = create<AppStore>((set) => ({
  notes: [],
  activeNoteId: null,

  async loadNotes() {
    const notes = await invoke<Note[]>('list_notes');
    set({ notes });
  },

  setActiveNote(id) {
    set({ activeNoteId: id });
  },

  async newNote() {
    // Empty title + empty body on purpose: the editor opens with the
    // cursor in the body so the user can just start typing. A title
    // gets derived from the first `#` heading on save (see
    // `storage::update_note`), and the sidebar falls back to
    // "(untitled)" until then.
    mark('create-invoked');
    const note = await invoke<Note>('create_note', {
      title: '',
      content: '',
    });
    mark('note-created');
    set((state) => ({
      notes: [note, ...state.notes],
      activeNoteId: note.id,
    }));
  },

  async saveNote(id, markdown) {
    // `update_note` returns the updated Note so we can patch the
    // single entry locally instead of re-fetching the whole list on
    // every keystroke.
    const updated = await invoke<Note>('update_note', { id, content: markdown });
    set((state) => ({
      notes: sortByUpdated([
        updated,
        ...state.notes.filter((n) => n.id !== id),
      ]),
    }));
  },

  async deleteNote(id) {
    await invoke('delete_note', { id });
    set((state) => ({
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  async searchNotes(query) {
    return await invoke<Note[]>('search_notes', { query });
  },

  async openDailyNote(date) {
    // Daily notes share the `notes` table — after the backend
    // returns, upsert the entry into the local list so the sidebar
    // reflects it without a round-trip to `list_notes`.
    const note = await invoke<Note>('get_or_create_daily_note', {
      date: date ?? null,
    });
    set((state) => ({
      notes: sortByUpdated([note, ...state.notes.filter((n) => n.id !== note.id)]),
      activeNoteId: note.id,
    }));
    return note;
  },
}));
