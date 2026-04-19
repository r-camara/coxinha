import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { NoteEditor } from './components/NoteEditor';
import { Sidebar } from './components/Sidebar';
import type { CallDetected } from './lib/bindings';
import { useAppStore } from './lib/store';

type View = 'notes' | 'agenda' | 'meetings' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('notes');
  const loadNotes = useAppStore((s) => s.loadNotes);
  const activeNoteId = useAppStore((s) => s.activeNoteId);
  const newNote = useAppStore((s) => s.newNote);

  useEffect(() => {
    let cancelled = false;
    const unsubs: UnlistenFn[] = [];

    loadNotes();

    (async () => {
      const navUnsub = await listen<string>('navigate', async (e) => {
        const route = e.payload;
        if (route === '/notes/new') {
          await newNote();
          setView('notes');
        } else if (route === '/agenda') {
          setView('agenda');
        } else if (route === '/meetings') {
          setView('meetings');
        } else if (route === '/settings') {
          setView('settings');
        } else if (route === '/actions/toggle-recording') {
          // TODO
        }
      });
      if (cancelled) return navUnsub();
      unsubs.push(navUnsub);

      const callUnsub = await listen<CallDetected>('call-detected', (e) => {
        console.log('Call detected', e.payload);
        // TODO: show a toast with a "Record" button
      });
      if (cancelled) return callUnsub();
      unsubs.push(callUnsub);
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((f) => f());
    };
  }, [loadNotes, newNote]);

  return (
    <div className="h-screen w-screen flex bg-[hsl(var(--background))]">
      <Sidebar current={view} onNavigate={setView} />

      <main className="flex-1 overflow-hidden">
        {view === 'notes' && activeNoteId && <NoteEditor noteId={activeNoteId} />}
        {view === 'notes' && !activeNoteId && <EmptyState />}
        {view === 'agenda' && <AgendaView />}
        {view === 'meetings' && <MeetingsView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  const newNote = useAppStore((s) => s.newNote);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-[hsl(var(--muted-foreground))]">
      <p>{t('empty.noNoteSelected')}</p>
      <button
        type="button"
        onClick={() => newNote()}
        className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {t('empty.newNoteCta')}
      </button>
    </div>
  );
}

function AgendaView() {
  const { t } = useTranslation();
  return (
    <section className="p-8" aria-labelledby="agenda-heading">
      <h1 id="agenda-heading" className="text-2xl font-bold mb-4">
        {t('agenda.title')}
      </h1>
      <p className="text-[hsl(var(--muted-foreground))]">
        {t('agenda.comingSoon')}
      </p>
    </section>
  );
}

function MeetingsView() {
  const { t } = useTranslation();
  return (
    <section className="p-8" aria-labelledby="meetings-heading">
      <h1 id="meetings-heading" className="text-2xl font-bold mb-4">
        {t('meetings.title')}
      </h1>
      <p className="text-[hsl(var(--muted-foreground))]">
        {t('meetings.comingSoon')}
      </p>
    </section>
  );
}

function SettingsView() {
  const { t } = useTranslation();
  return (
    <section className="p-8" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold mb-4">
        {t('settings.title')}
      </h1>
      <p className="text-[hsl(var(--muted-foreground))]">
        {t('settings.comingSoon')}
      </p>
    </section>
  );
}
