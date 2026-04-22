import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import type { UnlistenFn } from '@tauri-apps/api/event';

import { CommandPalette } from '../features/shell/CommandPalette';
import { events, type Route } from '../lib/bindings';
import { useSidePanel } from '../lib/panels';
import { mark } from '../lib/perf';
import { useAppStore } from '../lib/store';
import {
  followThemePreference,
  getThemePreference,
  THEME_PREF_EVENT,
} from '../lib/theme';

/**
 * Root layout. Every route renders inside its own AppShell (spec
 * 0057) so this component only owns global concerns: theme
 * follow-up, IPC listeners, command palette overlay, and
 * shortcut handling that spans every route.
 */
export function RootLayout() {
  const navigate = useNavigate();
  const loadNotes = useAppStore((s) => s.loadNotes);
  const newNote = useAppStore((s) => s.newNote);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    let cleanup = followThemePreference(getThemePreference());
    const handle = () => {
      cleanup();
      cleanup = followThemePreference(getThemePreference());
    };
    window.addEventListener(THEME_PREF_EVENT, handle);
    return () => {
      cleanup();
      window.removeEventListener(THEME_PREF_EVENT, handle);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const unsubs: UnlistenFn[] = [];

    loadNotes();

    (async () => {
      const navUnsub = await events.navigate.listen(async (e) => {
        await handleRoute(e.payload.route);
      });
      if (cancelled) return navUnsub();
      unsubs.push(navUnsub);

      const callUnsub = await events.callDetected.listen((e) => {
        // TODO(spec 0007): surface a toast with a "Record" button.
        // eslint-disable-next-line no-console
        console.log('Call detected', e.payload);
      });
      if (cancelled) return callUnsub();
      unsubs.push(callUnsub);
    })();

    async function handleRoute(route: Route) {
      switch (route) {
        case 'notes-new': {
          mark('hotkey');
          const note = await newNote();
          navigate({ to: '/notes/$noteId', params: { noteId: note.id } });
          return;
        }
        case 'home':
          navigate({ to: '/' });
          return;
        case 'agenda':
          navigate({ to: '/agenda' });
          return;
        case 'meetings':
          // /meetings was removed in spec 0057; the shortcut slot
          // is repurposed in a later commit. Until then, send the
          // user to /notes so they land somewhere sensible.
          navigate({ to: '/notes' });
          return;
        case 'settings':
          navigate({ to: '/settings' });
          return;
        case 'toggle-recording':
          // TODO (spec 0007)
          return;
      }
    }

    return () => {
      cancelled = true;
      unsubs.forEach((f) => f());
    };
  }, [loadNotes, navigate, newNote]);

  // Ctrl+K / Ctrl+P open the command palette; Ctrl+\ toggles
  // the side panel. All gated on Ctrl/Cmd so they don't fight
  // the editor's own hotkeys.
  const toggleSidePanel = useSidePanel((s) => s.toggle);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'k' || key === 'p') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (key === '\\') {
        e.preventDefault();
        toggleSidePanel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidePanel]);

  return (
    <>
      <Outlet />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
