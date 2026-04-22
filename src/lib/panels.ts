import { create } from 'zustand';

const STORAGE_KEY = 'coxinha:side-panel';

interface SidePanelStore {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

function readPersisted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return true;
    return JSON.parse(raw) === true;
  } catch {
    return true;
  }
}

function persist(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
  } catch {
    // localStorage unavailable (private browsing etc.) — silently
    // fall back to in-memory only. Users lose preference across
    // reloads but the panel still works.
  }
}

export const useSidePanel = create<SidePanelStore>((set) => ({
  open: readPersisted(),
  toggle() {
    set((s) => {
      const next = !s.open;
      persist(next);
      return { open: next };
    });
  },
  setOpen(open) {
    persist(open);
    set({ open });
  },
}));
