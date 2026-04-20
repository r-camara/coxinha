import { useEffect } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import type { UnlistenFn } from '@tauri-apps/api/event';

import { Sidebar, type View } from '../components/Sidebar';
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
  const loadNotes = useAppStore((s) => s.loadNotes);
  const newNote = useAppStore((s) => s.newNote);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const view = viewFromPath(pathname);

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

  return (
    <div className="h-screen w-screen flex bg-background text-foreground">
      <Sidebar
        current={view}
        onNavigate={(v) => navigate({ to: viewToPath(v) })}
      />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function viewFromPath(pathname: string): View {
  if (pathname.startsWith('/agenda')) return 'agenda';
  if (pathname.startsWith('/meetings')) return 'meetings';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'notes';
}

function viewToPath(view: View): string {
  switch (view) {
    case 'notes':
      return '/notes';
    case 'agenda':
      return '/agenda';
    case 'meetings':
      return '/meetings';
    case 'settings':
      return '/settings';
  }
}
