import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';

import { RouteLayout } from '../components/RouteLayout';
import { isInteractiveClickTarget } from '../features/notes/editorFocus';
import { useAppStore } from '../lib/store';
import { useResolvedTheme } from '../lib/useTheme';

/**
 * Empty-state route (spec 0042). Renders the editor directly on a
 * transient in-memory draft instead of a centered CTA. The first
 * meaningful keystroke creates the note via `store.newNote`, and
 * the router replaces the URL to `/notes/$id` without a remount.
 *
 * Blur (or leaving the route) without any content discards the
 * draft — no IPC, no file, no row.
 */
export function NotesIndexRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const newNote = useAppStore((s) => s.newNote);
  const saveNote = useAppStore((s) => s.saveNote);
  const theme = useResolvedTheme();

  const persistingRef = useRef(false);
  const pendingContentRef = useRef<string>('');
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, []);

  async function onChange() {
    if (persistingRef.current) return;
    const md = await editor.blocksToMarkdownLossy(editor.document);
    pendingContentRef.current = md;
    if (md.trim().length === 0) return;

    // 200 ms debounce after first meaningful content: one keypress-
    // and-release doesn't leak a file, but a real keystroke does.
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(persistDraft, 200);
  }

  async function persistDraft() {
    if (persistingRef.current) return;
    persistingRef.current = true;
    persistTimerRef.current = null;
    try {
      const note = await newNote();
      const md = pendingContentRef.current;
      if (md.length > 0) {
        await saveNote(note.id, md);
      }
      await navigate({
        to: '/notes/$noteId',
        params: { noteId: note.id },
        replace: true,
      });
    } catch (err) {
      persistingRef.current = false;
      // eslint-disable-next-line no-console
      console.error('failed to persist draft', err);
    }
  }

  return (
    <RouteLayout
      trail={[t('nav.notes').toLowerCase(), 'untitled.md']}
      statusLeft={<span>{t('status.draftCount')}</span>}
    >
      <section
        className="h-full overflow-auto bn-container cursor-text"
        aria-label={t('editor.region')}
        data-testid="notes-index-draft"
        onMouseDown={(e) => {
          if (isInteractiveClickTarget(e.target)) return;
          editor.focus();
        }}
      >
        <div className="mx-auto max-w-[760px] px-24 pt-12">
          <BlockNoteView editor={editor} onChange={onChange} theme={theme} />
        </div>
      </section>
    </RouteLayout>
  );
}
