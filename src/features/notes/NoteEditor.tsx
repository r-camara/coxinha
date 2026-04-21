import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { invoke } from '@tauri-apps/api/core';

import { events, type NoteContent } from '../../lib/bindings';
import { logNewNoteTrace, mark } from '../../lib/perf';
import { useAppStore } from '../../lib/store';
import { useResolvedTheme } from '../../lib/useTheme';
import { BacklinksPanel } from './BacklinksPanel';
import { isInteractiveClickTarget } from './editorFocus';
import { NoteHeader } from './NoteHeader';

interface Props {
  noteId: string;
  /**
   * Pre-resolved content for the note. Routes load this ahead of
   * render via TanStack Query; the component stays a dumb editor
   * that receives what it needs to render instead of owning the
   * fetch. Tests can render it directly with a fixture.
   */
  content: NoteContent;
}

export function NoteEditor({ noteId, content }: Props) {
  // Placed at the top of the component body so the mark captures
  // the end of the Suspense wait (the loader resolves before this
  // render fires). Harmless if this isn't a new-note flow —
  // `logNewNoteTrace` bails when the `hotkey` mark is missing.
  mark('editor-suspended');
  const saveNote = useAppStore((s) => s.saveNote);

  return (
    <EditorInner
      noteId={noteId}
      initialMarkdown={content.markdown}
      title={content.note.title}
      tags={content.note.tags ?? []}
      updatedAt={content.note.updated_at as unknown as string}
      onSave={(md) => saveNote(noteId, md)}
    />
  );
}

function EditorInner({
  noteId,
  initialMarkdown,
  title,
  tags,
  updatedAt,
  onSave,
}: {
  noteId: string;
  initialMarkdown: string;
  title: string;
  tags: string[];
  updatedAt: string;
  onSave: (md: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      const compressed = await compressImage(file);
      const arrayBuffer = await compressed.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const relPath = await invoke<string>('save_attachment', {
        filename: compressed.name,
        bytes,
      });

      return `coxinha://attachments/${relPath.replace(/^attachments\//, '')}`;
    },
  });

  useEffect(() => {
    (async () => {
      if (initialMarkdown.length > 0) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
        editor.replaceBlocks(editor.document, blocks);
      }
      editor.focus();
      mark('editor-ready');
      logNewNoteTrace();
    })();
  }, [editor, initialMarkdown]);

  // Timer lives in a ref so the unmount cleanup below can cancel it.
  // Without this, switching notes during the 500 ms window fires a
  // save against a torn-down BlockNote instance.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  const flushNow = useMemo(
    () => async () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const md =
        pendingContentRef.current ??
        (await editor.blocksToMarkdownLossy(editor.document));
      pendingContentRef.current = null;
      onSave(md);
    },
    [editor, onSave],
  );

  const debouncedSave = useMemo(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        pendingContentRef.current = await editor.blocksToMarkdownLossy(
          editor.document,
        );
        saveTimerRef.current = null;
        const md = pendingContentRef.current;
        pendingContentRef.current = null;
        onSave(md);
      }, 500);
    },
    [editor, onSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    events.beforeQuit
      .listen(() => {
        void flushNow();
      })
      .then((f) => {
        unlisten = f;
      });
    return () => {
      unlisten?.();
    };
  }, [flushNow]);

  function focusEditorOnDeadSpace(e: React.MouseEvent<HTMLElement>) {
    // Clicks inside the editor surface or on interactive chrome
    // (title, tags, header buttons) already do the right thing —
    // only rescue clicks that landed on the dead padded area.
    if (isInteractiveClickTarget(e.target)) return;
    const doc = editor.document;
    const last = doc[doc.length - 1];
    if (last) editor.setTextCursorPosition(last, 'end');
    editor.focus();
  }

  return (
    <div className="h-full flex">
      <section
        className="flex-1 min-w-0 overflow-auto bn-container cursor-text"
        aria-label={t('editor.region')}
        onMouseDown={focusEditorOnDeadSpace}
        data-testid="note-editor-surface"
      >
        <div className="mx-auto max-w-[760px] px-24 pt-12 pb-10">
          <NoteHeader title={title} tags={tags} updatedAt={updatedAt} />
          <BlockNoteView
            editor={editor}
            onChange={debouncedSave}
            data-note-id={noteId}
            theme={theme}
          />
        </div>
      </section>
      <BacklinksPanel noteId={noteId} />
    </div>
  );
}

/**
 * Compresses an image to WebP before upload.
 *
 * - Resizes when width > 1600px
 * - Converts to WebP at quality 0.85
 * - Falls back to the original file on failure
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_WIDTH = 1600;

    const scale = bitmap.width > MAX_WIDTH ? MAX_WIDTH / bitmap.width : 1;
    const outW = Math.round(bitmap.width * scale);
    const outH = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, outW, outH);

    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.85,
    });

    const newName = file.name.replace(/\.[^.]+$/, '.webp');
    return new File([blob], newName, { type: 'image/webp' });
  } catch (e) {
    console.warn('Image compression failed, using original', e);
    return file;
  }
}

export function NoteLoadingSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="p-8 space-y-3 animate-pulse"
    >
      <span className="sr-only">{t('editor.loading')}</span>
      <div className="h-8 w-1/2 bg-muted rounded" aria-hidden="true" />
      <div className="h-4 w-full bg-muted rounded" aria-hidden="true" />
      <div className="h-4 w-5/6 bg-muted rounded" aria-hidden="true" />
      <div className="h-4 w-4/6 bg-muted rounded" aria-hidden="true" />
    </div>
  );
}
