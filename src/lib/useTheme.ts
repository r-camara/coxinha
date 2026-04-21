import { useEffect, useState } from 'react';

import {
  getThemePreference,
  resolveThemePreference,
  systemTheme,
  type Theme,
  THEME_PREF_EVENT,
} from './theme';

/**
 * Reactive read of the currently applied theme ('light' | 'dark').
 * Listens to the `THEME_PREF_EVENT` dispatched by `setThemePreference`
 * and to the OS `prefers-color-scheme` media query. Used by
 * components that need to hand the theme down to libraries (BlockNote,
 * tooltips, etc.) — everything else should rely on the `.dark` class
 * on `<html>` + CSS variables.
 */
export function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => systemTheme());

  useEffect(() => {
    const read = () => setTheme(resolveThemePreference(getThemePreference()));
    read();
    const onPrefChange = () => read();
    window.addEventListener(THEME_PREF_EVENT, onPrefChange);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);
    return () => {
      window.removeEventListener(THEME_PREF_EVENT, onPrefChange);
      media.removeEventListener('change', read);
    };
  }, []);

  return theme;
}
