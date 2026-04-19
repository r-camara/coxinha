export type Theme = 'light' | 'dark';
export type ThemePreference = 'auto' | Theme;

const DARK_QUERY = '(prefers-color-scheme: dark)';
const STORAGE_KEY = 'coxinha.themePref';

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: Element = document.documentElement): void {
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function getThemePreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'auto';
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : 'auto';
}

export const THEME_PREF_EVENT = 'coxinha:theme-pref-changed';

// Persist the user's choice and broadcast it so any component
// following it (e.g. App.tsx) can re-apply without a page reload.
export function setThemePreference(pref: ThemePreference): void {
  if (typeof localStorage !== 'undefined') {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_PREF_EVENT, { detail: pref }));
  }
}

// Apply `pref` and, when it's 'auto', keep the `.dark` class in sync
// as the OS preference flips. Returns a cleanup fn.
export function followThemePreference(
  pref: ThemePreference,
  root: Element = document.documentElement,
): () => void {
  if (pref !== 'auto') {
    applyTheme(pref, root);
    return () => {};
  }
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia(DARK_QUERY);
  const handle = (event: MediaQueryListEvent | MediaQueryList) => {
    applyTheme(event.matches ? 'dark' : 'light', root);
  };
  handle(mq);
  mq.addEventListener('change', handle);
  return () => mq.removeEventListener('change', handle);
}

// Back-compat shim for callers that want OS-follow regardless of
// stored preference. Retained because it's still used by tests.
export function followSystemTheme(root: Element = document.documentElement): () => void {
  return followThemePreference('auto', root);
}
