/**
 * Theme sync: mirror the OS `prefers-color-scheme` onto the `.dark`
 * class of <html>. That's the class Tailwind's `darkMode: "class"`
 * config and every shadcn token expects.
 *
 * Later (spec 0010, Settings > Appearance), a user override will
 * take priority; for now we just follow the OS.
 */

export type Theme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: Element = document.documentElement): void {
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

/**
 * Apply the current OS theme immediately, then keep it in sync as
 * the user toggles their OS preference. Returns an unsubscribe
 * function so React effects (or tests) can clean up.
 */
export function followSystemTheme(
  root: Element = document.documentElement
): () => void {
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
