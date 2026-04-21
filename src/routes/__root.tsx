import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import type { UnlistenFn } from '@tauri-apps/api/event';

import { IconRail } from '../components/IconRail';
import { AiPanel } from '../features/shell/AiPanel';
import { CommandPalette } from '../features/shell/CommandPalette';
import { events, type Route } from '../lib/bindings';
import { mark } from '../lib/perf';
import { useAppStore } from '../lib/store';
import {
  followThemePreference,
  getThemePreference,
  THEME_PREF_EVENT,
} from '../lib/theme';

export function RootLayout() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (s) => s.pathname });
  const loadNotes = useAppStore((s) => s.loadNotes);
  const newNote = useAppStore((s) => s.newNote);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // AI panel is visible by default on note-detail routes where
  // link/related suggestions make sense. Other routes keep it
  // hidden so the chrome stays quiet.
  const [aiPanelOpen, setAiPanelOpen] = useState(() =>
    pathname.startsWith('/notes/') && pathname !== '/notes',
  );

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
          navigate({ to: '/notes' });
          return;
        case 'agenda':
          navigate({ to: '/agenda' });
          return;
        case 'meetings':
          navigate({ to: '/meetings' });
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

  // Ctrl+K / Ctrl+P open the command palette; Ctrl+J toggles
  // the AI panel. All gated on Ctrl/Cmd so they don't fight the
  // editor's own hotkeys.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'k' || key === 'p') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (key === 'j') {
        e.preventDefault();
        setAiPanelOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-screen w-screen flex bg-background text-foreground">
      <IconRail onOpenPalette={() => setPaletteOpen(true)} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <AiPanel
        open={aiPanelOpen}
        onToggle={() => setAiPanelOpen((v) => !v)}
        onClose={() => setAiPanelOpen(false)}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
