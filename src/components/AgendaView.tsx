import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { NoteEditor } from './NoteEditor';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; noteId: string }
  | { kind: 'error'; message: string };

export function AgendaView() {
  const { t } = useTranslation();
  const openDailyNote = useAppStore((s) => s.openDailyNote);
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const note = await openDailyNote();
        if (!cancelled) setState({ kind: 'ready', noteId: note.id });
      } catch (e) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openDailyNote]);

  return (
    <section className="h-full flex flex-col" aria-labelledby="agenda-heading">
      <header className="px-8 pt-6 pb-2">
        <h1 id="agenda-heading" className="text-2xl font-bold">
          {t('agenda.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('agenda.dailyHeading')}
        </p>
      </header>
      <div className="flex-1 overflow-hidden">
        {state.kind === 'loading' && (
          <p className="px-8 text-muted-foreground" role="status" aria-live="polite">
            {t('agenda.loading')}
          </p>
        )}
        {state.kind === 'error' && (
          <p className="px-8 text-red-600" role="alert">
            {t('agenda.error', { error: state.message })}
          </p>
        )}
        {state.kind === 'ready' && <NoteEditor noteId={state.noteId} />}
      </div>
    </section>
  );
}
