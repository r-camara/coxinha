import { Suspense, use, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { invoke } from '@tauri-apps/api/core';

import { events, type NoteContent } from '../lib/bindings';
import { logNewNoteTrace, mark } from '../lib/perf';
import { useAppStore } from '../lib/store';
import { BacklinksPanel } from './BacklinksPanel';

interface Props {
  noteId: string;
}

// React 19's `use()` requires a stable promise identity across
// renders; recreating it per render loops Suspense forever. Module
// scope is fine because saves go through the store, not this cache.
const noteCache = new Map<string, Promise<NoteContent>>();

function getNotePromise(noteId: string): Promise<NoteContent> {
  let p = noteCache.get(noteId);
  if (!p) {
    p = invoke<NoteContent>('get_note', { id: noteId });
    noteCache.set(noteId, p);
  }
  return p;
}

export function NoteEditor({ noteId }: Props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NoteEditorContent noteId={noteId} />
    </Suspense>
  );
}

function NoteEditorContent({ noteId }: Props) {
  const content = use(getNotePromise(noteId));
  // Placed after `use()` resolves so the mark captures the end of
  // the Suspense wait. Harmless if this isn't a new-note flow —
  // `logNewNoteTrace` bails when the `hotkey` mark is missing.
  mark('editor-suspended');
  const saveNote = useAppStore((s) => s.saveNote);

  return (
    <EditorInner
      noteId={noteId}
      initialMarkdown={content.markdown}
      onSave={(md) => saveNote(noteId, md)}
    />
  );
}

function EditorInner({
  noteId,
  initialMarkdown,
  onSave,
}: {
  noteId: string;
  initialMarkdown: string;
  onSave: (md: string) => void;
}) {
  const { t } = useTranslation();
  const editor = useCreateBlockNote({
    // Image paste: intercept, compress to WebP, save as an attachment
    uploadFile: async (file: File) => {
      const compressed = await compressImage(file);
      const arrayBuffer = await compressed.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const relPath = await invoke<string>('save_attachment', {
        filename: compressed.name,
        bytes,
      });

      // URL that BlockNote places into the image src.
      // Tauri serves vault files via the asset protocol.
      return `coxinha://attachments/${relPath.replace(/^attachments\//, '')}`;
    },
  });

  useEffect(() => {
    (async () => {
      if (initialMarkdown.length > 0) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
        editor.replaceBlocks(editor.document, blocks);
      }
      // Land the cursor in the body so a fresh note (empty markdown)
      // or a returning one starts editable without a click.
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

  // Graceful shutdown: flush pending debounce before Rust exits.
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

  return (
    <div className="h-full flex">
      <section
        className="flex-1 min-w-0 overflow-auto bn-container"
        aria-label={t('editor.region')}
      >
        <BlockNoteView
          editor={editor}
          onChange={debouncedSave}
          data-note-id={noteId}
        />
      </section>
      <BacklinksPanel noteId={noteId} />
    </div>
  );
}

function LoadingSkeleton() {
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

/**
 * Compresses an image to WebP before upload.
 *
 * - Resizes when width > 1600px
 * - Converts to WebP at quality 0.85
 * - Falls back to the original file on failure
 *
 * The backend also compresses defensively, but doing it here cuts
 * the IPC payload.
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
