import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { invoke } from '@tauri-apps/api/core';

import { events, type NoteContent } from '../../lib/bindings';
import { logNewNoteTrace, mark } from '../../lib/perf';
import { useAppStore } from '../../lib/store';
import { useResolvedTheme } from '../../lib/useTheme';
import { meetingBlockSpec } from '../meetings/MeetingBlock';
import { BacklinksPanel } from './BacklinksPanel';
import { isInteractiveClickTarget } from './editorFocus';
import { NoteActionsMenu, type NoteFont } from './NoteActionsMenu';
import { NoteHeader } from './NoteHeader';

// Schema extends BlockNote's defaults with our custom MeetingBlock.
// Created once at module scope so useCreateBlockNote doesn't rebuild
// it on every render (spec 0057).
const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    meeting: meetingBlockSpec,
  },
});

const PREF_FONT_KEY = 'coxinha:note-font';
const PREF_SMALL_KEY = 'coxinha:note-small';
const PREF_FULLWIDTH_KEY = 'coxinha:note-full-width';

function readPrefString<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  return (allowed as readonly string[]).includes(raw ?? '') ? (raw as T) : fallback;
}

function readPrefBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === '1') return true;
  if (raw === '0') return false;
  return fallback;
}

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
  const deleteNote = useAppStore((s) => s.deleteNote);
  const duplicateNote = useAppStore((s) => s.duplicateNote);
  const navigate = useNavigate();

  return (
    <EditorInner
      noteId={noteId}
      initialMarkdown={content.markdown}
      title={content.note.title}
      tags={content.note.tags ?? []}
      updatedAt={content.note.updated_at as unknown as string}
      onSave={(md) => saveNote(noteId, md)}
      onDelete={async () => {
        await deleteNote(noteId);
        await navigate({ to: '/notes' });
      }}
      onDuplicate={async () => {
        const copy = await duplicateNote(noteId);
        await navigate({ to: '/notes/$noteId', params: { noteId: copy.id } });
      }}
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
  onDelete,
  onDuplicate,
}: {
  noteId: string;
  initialMarkdown: string;
  title: string;
  tags: string[];
  updatedAt: string;
  onSave: (md: string) => void;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [font, setFont] = useState<NoteFont>(() =>
    readPrefString<NoteFont>(PREF_FONT_KEY, ['default', 'serif', 'mono'], 'default'),
  );
  const [smallText, setSmallText] = useState(() => readPrefBool(PREF_SMALL_KEY, false));
  const [fullWidth, setFullWidth] = useState(() => readPrefBool(PREF_FULLWIDTH_KEY, false));

  useEffect(() => {
    window.localStorage.setItem(PREF_FONT_KEY, font);
  }, [font]);
  useEffect(() => {
    window.localStorage.setItem(PREF_SMALL_KEY, smallText ? '1' : '0');
  }, [smallText]);
  useEffect(() => {
    window.localStorage.setItem(PREF_FULLWIDTH_KEY, fullWidth ? '1' : '0');
  }, [fullWidth]);
  const editor = useCreateBlockNote({
    schema: editorSchema,
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

  // Ctrl+. (or Cmd+. on mac) toggles the actions menu — mirrors
  // Notion's shortcut. Gated on Ctrl/Cmd so it doesn't fight the
  // editor's own typing of a period.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key !== '.') return;
      e.preventDefault();
      setMenuOpen((v) => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  async function copyContentsToClipboard() {
    const md = await editor.blocksToMarkdownLossy(editor.document);
    await navigator.clipboard.writeText(md);
  }

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(`coxinha://notes/${noteId}`);
  }

  async function confirmAndDelete() {
    const label = title || t('sidebar.untitled');
    if (!window.confirm(t('palette.deleteConfirm', { title: label }))) return;
    await onDelete();
  }

  const wordCount = useMemo(
    () =>
      initialMarkdown
        .replace(/[#>*`_~\-]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length,
    [initialMarkdown],
  );

  return (
    <div
      className={clsx(
        'h-full flex',
        font === 'serif' && 'cx-note-font-serif',
        font === 'mono' && 'cx-note-font-mono',
        smallText && 'cx-note-size-small',
      )}
    >
      <section
        className="relative flex-1 min-w-0 overflow-auto bn-container cursor-text"
        aria-label={t('editor.region')}
        onMouseDown={focusEditorOnDeadSpace}
        data-testid="note-editor-surface"
      >
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t('noteMenu.open')}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={`${t('noteMenu.open')} (Ctrl+.)`}
          data-testid="note-actions-trigger"
          className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-md border border-border bg-secondary/60 hover:bg-secondary px-2 py-1.5 text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring shadow-sm"
        >
          <MoreHorizontal size={16} aria-hidden="true" />
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-muted-foreground">
            ⌘.
          </kbd>
        </button>
        <div
          className={clsx(
            'mx-auto px-24 pt-12 pb-10',
            fullWidth ? 'max-w-none' : 'max-w-[760px]',
          )}
        >
          <NoteHeader title={title} tags={tags} updatedAt={updatedAt} />
          <BlockNoteView
            editor={editor}
            onChange={debouncedSave}
            data-note-id={noteId}
            theme={theme}
          />
        </div>
        <NoteActionsMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuButtonRef}
          footer={{ wordCount }}
          onCopyLink={() => void copyLinkToClipboard()}
          onCopyContents={() => void copyContentsToClipboard()}
          onDuplicate={() => void onDuplicate()}
          onMoveToTrash={() => void confirmAndDelete()}
          onUndo={() => editor.undo()}
          font={font}
          onFontChange={setFont}
          smallText={smallText}
          onSmallTextChange={setSmallText}
          fullWidth={fullWidth}
          onFullWidthChange={setFullWidth}
        />
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
