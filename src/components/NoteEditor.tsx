import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { invoke } from '@tauri-apps/api/core';

import type { NoteContent } from '../lib/bindings';
import { useAppStore } from '../lib/store';

interface Props {
  noteId: string;
}

export function NoteEditor({ noteId }: Props) {
  const [initialMarkdown, setInitialMarkdown] = useState<string | null>(null);
  const saveNote = useAppStore((s) => s.saveNote);

  useEffect(() => {
    (async () => {
      const res = await invoke<NoteContent>('get_note', { id: noteId });
      setInitialMarkdown(res.markdown);
    })();
  }, [noteId]);

  if (initialMarkdown === null) {
    return <LoadingSkeleton />;
  }

  return (
    <EditorInner
      noteId={noteId}
      initialMarkdown={initialMarkdown}
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
    })();
  }, [editor, initialMarkdown]);

  const debouncedSave = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        onSave(md);
      }, 500);
    };
  }, [editor, onSave]);

  return (
    <section
      className="h-full overflow-auto bn-container"
      aria-label={t('editor.region')}
    >
      <BlockNoteView
        editor={editor}
        onChange={debouncedSave}
        data-note-id={noteId}
      />
    </section>
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
