import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, followSystemTheme, systemTheme } from './theme';

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

  it('followSystemTheme applies the current value immediately', () => {
    const mq = fakeMatchMedia(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followSystemTheme(root);
    expect(root.classList.contains('dark')).toBe(true);
    cleanup();
  });

  it('followSystemTheme reacts when the OS flips the preference', () => {
    const mq = fakeMatchMedia(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const cleanup = followSystemTheme(root);
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

    const cleanup = followSystemTheme(root);
    cleanup();

    mq.dispatch(true);
    // Class should NOT flip after cleanup removed the listener.
    expect(root.classList.contains('dark')).toBe(false);
  });
});
