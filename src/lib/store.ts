import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

import type { Note } from './bindings';

interface AppStore {
  notes: Note[];
  activeNoteId: string | null;

  loadNotes: () => Promise<void>;
  setActiveNote: (id: string | null) => void;
  newNote: () => Promise<void>;
  saveNote: (id: string, markdown: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<Note[]>;
}

export const useAppStore = create<AppStore>((set, get) => ({
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
    const note = await invoke<Note>('create_note', {
      title: 'New note',
      content: '# New note\n\n',
    });
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
}));

function sortByUpdated(notes: Note[]): Note[] {
  return notes.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
