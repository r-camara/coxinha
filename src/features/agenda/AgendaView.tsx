import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { NoteContent } from '../../lib/bindings';
import { commands } from '../../lib/bindings';
import { useAppStore } from '../../lib/store';
import { NoteEditor, NoteLoadingSkeleton } from '../notes/NoteEditor';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; noteId: string; content: NoteContent }
  | { kind: 'error'; message: string };

export function AgendaView() {
  const { t } = useTranslation();
  const openDailyNote = useAppStore((s) => s.openDailyNote);
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const note = await openDailyNote();
        // Warm the query cache so NoteEditor renders without a
        // second IPC roundtrip.
        const contentRes = await commands.getNote(note.id);
        if (contentRes.status === 'error') {
          throw new Error(contentRes.error);
        }
        queryClient.setQueryData(['note', note.id], contentRes.data);
        if (!cancelled) {
          setState({ kind: 'ready', noteId: note.id, content: contentRes.data });
        }
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
  }, [openDailyNote, queryClient]);

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
        {state.kind === 'loading' && <NoteLoadingSkeleton />}
        {state.kind === 'error' && (
          <p className="px-8 text-red-600" role="alert">
            {t('agenda.error', { error: state.message })}
          </p>
        )}
        {state.kind === 'ready' && (
          <NoteEditor noteId={state.noteId} content={state.content} />
        )}
      </div>
    </section>
  );
}
