import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { AppShell, SavedIndicator } from '../components/AppShell';
import { commands, type NoteContent } from '../lib/bindings';
import { NoteEditor, NoteLoadingSkeleton } from '../features/notes/NoteEditor';

export function noteContentQueryOptions(noteId: string) {
  return queryOptions({
    queryKey: ['note', noteId] as const,
    queryFn: async (): Promise<NoteContent> => {
      const r = await commands.getNote(noteId);
      if (r.status === 'error') throw new Error(r.error);
      return r.data;
    },
    // Keep cached content fresh until a save invalidates it.
    staleTime: Infinity,
  });
}

export function NoteDetailRoute() {
  const { noteId } = useParams({ from: '/notes/$noteId' });
  return (
    <Suspense fallback={<NoteLoadingSkeleton />}>
      <NoteDetailInner noteId={noteId} />
    </Suspense>
  );
}

function NoteDetailInner({ noteId }: { noteId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery(noteContentQueryOptions(noteId));
  if (!data) {
    return <NoteLoadingSkeleton />;
  }
  const title = data.note.title || t('sidebar.untitled');
  return (
    <AppShell
      trail={[t('nav.notes').toLowerCase(), `${title}.md`]}
      tabs={[{ id: `note-${noteId}`, label: `${title}.md`, active: true }]}
      chromeRight={<SavedIndicator label={t('chrome.saved')} />}
    >
      <NoteEditor noteId={noteId} content={data} />
    </AppShell>
  );
}
