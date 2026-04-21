import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { RouteLayout } from '../components/RouteLayout';
import { SavedIndicator } from '../components/ChromeBar';
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
  // `useQuery` with an Infinity staleTime reads from the loader's
  // pre-warmed cache — no fresh IPC unless the query has been
  // invalidated.
  const { data } = useQuery(noteContentQueryOptions(noteId));
  if (!data) {
    // Loader resolves the promise, so this branch only hits during
    // the brief window after invalidation before refetch returns.
    return <NoteLoadingSkeleton />;
  }
  const title = data.note.title || t('sidebar.untitled');
  return (
    <RouteLayout
      trail={[t('nav.notes').toLowerCase(), `${title}.md`]}
      chromeRight={<SavedIndicator label="Saved" />}
    >
      <NoteEditor noteId={noteId} content={data} />
    </RouteLayout>
  );
}
