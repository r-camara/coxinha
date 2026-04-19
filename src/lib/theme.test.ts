import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  followThemePreference,
  getThemePreference,
  setThemePreference,
  systemTheme,
  THEME_STORAGE_KEY,
} from './theme';

type MqListener = (e: MediaQueryListEvent) => void;

interface FakeMediaQuery {
  matches: boolean;
  addEventListener: (type: 'change', l: MqListener) => void;
  removeEventListener: (type: 'change', l: MqListener) => void;
  dispatch: (matches: boolean) => void;
}

function fakeMatchMedia(initial: boolean): FakeMediaQuery {
  const listeners = new Set<MqListener>();
  const mq: FakeMediaQuery = {
    matches: initial,
    addEventListener: (_t, l) => listeners.add(l),
    removeEventListener: (_t, l) => listeners.delete(l),
    dispatch: (matches) => {
      mq.matches = matches;
      for (const l of listeners) l({ matches } as MediaQueryListEvent);
    },
  };
  return mq;
}

describe('theme helpers', () => {
  let root: Element;

  beforeEach(() => {
    root = document.createElement('html');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applyTheme toggles the `.dark` class on the given root', () => {
    applyTheme('dark', root);
    expect(root.classList.contains('dark')).toBe(true);
    applyTheme('light', root);
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('systemTheme reads prefers-color-scheme', () => {
    const dark = fakeMatchMedia(true);
    vi.stubGlobal('matchMedia', vi.fn(() => dark));
    expect(systemTheme()).toBe('dark');

    const light = fakeMatchMedia(false);
    vi.stubGlobal('matchMedia', vi.fn(() => light));
    expect(systemTheme()).toBe('light');
  });

  it('followThemePreference("auto") applies the current value immediately', () => {
    const mq = fakeMatchMedia(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followThemePreference('auto', root);
    expect(root.classList.contains('dark')).toBe(true);
    cleanup();
  });

  it('followThemePreference("auto") reacts when the OS flips the preference', () => {
    const mq = fakeMatchMedia(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followThemePreference('auto', root);
    expect(root.classList.contains('dark')).toBe(false);

    mq.dispatch(true);
    expect(root.classList.contains('dark')).toBe(true);

    mq.dispatch(false);
    expect(root.classList.contains('dark')).toBe(false);

    cleanup();
  });

  it('cleanup function unbinds the listener', () => {
    const mq = fakeMatchMedia(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followThemePreference('auto', root);
    cleanup();

    mq.dispatch(true);
    expect(root.classList.contains('dark')).toBe(false);
  });
});

describe('theme preference', () => {
  let root: Element;

  beforeEach(() => {
    root = document.createElement('html');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to "auto" when nothing is stored', () => {
    expect(getThemePreference()).toBe('auto');
  });

  it('persists explicit light/dark choices to localStorage', () => {
    setThemePreference('dark');
    expect(getThemePreference()).toBe('dark');
    setThemePreference('light');
    expect(getThemePreference()).toBe('light');
  });

  it('"auto" clears the stored value so next session re-reads the OS', () => {
    setThemePreference('dark');
    setThemePreference('auto');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(getThemePreference()).toBe('auto');
  });

  it('followThemePreference("dark") applies dark and ignores OS', () => {
    const mq = fakeMatchMedia(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followThemePreference('dark', root);
    expect(root.classList.contains('dark')).toBe(true);

    mq.dispatch(true);
    // The OS flipped to dark — already dark, stays dark. Flip OS back:
    mq.dispatch(false);
    // Preference "dark" ignores OS — still dark.
    expect(root.classList.contains('dark')).toBe(true);
    cleanup();
  });

  it('followThemePreference("light") applies light and ignores OS', () => {
    const mq = fakeMatchMedia(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followThemePreference('light', root);
    expect(root.classList.contains('dark')).toBe(false);

    mq.dispatch(true);
    // OS went dark but preference is light — stays light.
    expect(root.classList.contains('dark')).toBe(false);
    cleanup();
  });
});
