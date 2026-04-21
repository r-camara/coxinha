export type Theme = 'light' | 'dark';
export type ThemePreference = 'auto' | Theme;

const DARK_QUERY = '(prefers-color-scheme: dark)';
export const THEME_STORAGE_KEY = 'coxinha.themePref';

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
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : 'auto';
}

export const THEME_PREF_EVENT = 'coxinha:theme-pref-changed';

// Write + broadcast together so callers can't forget the dispatch
// and let App.tsx drift out of sync with localStorage.
export function setThemePreference(pref: ThemePreference): void {
  if (typeof localStorage !== 'undefined') {
    if (pref === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_PREF_EVENT, { detail: pref }));
  }
}

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

export function resolveThemePreference(pref: ThemePreference): Theme {
  return pref === 'auto' ? systemTheme() : pref;
}
