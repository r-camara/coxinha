import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Settings, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { useAppStore } from '../../lib/store';
import {
  applyTheme,
  getThemePreference,
  setThemePreference,
  systemTheme,
} from '../../lib/theme';

interface Props {
  open: boolean;
  onClose: () => void;
}

type PaletteRow =
  | { kind: 'note'; id: string; label: string; hint?: string }
  | { kind: 'action'; id: string; label: string; hint?: string; run: () => void };

type Group = { label: string; items: PaletteRow[] };

/**
 * Ctrl+K overlay. Fuzzy across note titles + an action registry
 * (new note, switch view, toggle theme, open settings). Translated
 * from the Claude Design handoff `CommandPalette.jsx` to TypeScript
 * and wired into our router + store. Spec 0043.
 */
export function CommandPalette({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notes = useAppStore((s) => s.notes);
  const newNote = useAppStore((s) => s.newNote);

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  const actions = useMemo<PaletteRow[]>(
    () => [
      {
        kind: 'action',
        id: 'new-note',
        label: t('palette.actions.newNote'),
        hint: 'Ctrl+N',
        run: async () => {
          const note = await newNote();
          await navigate({
            to: '/notes/$noteId',
            params: { noteId: note.id },
          });
        },
      },
      {
        kind: 'action',
        id: 'open-agenda',
        label: t('palette.actions.openAgenda'),
        hint: 'Win+Shift+A',
        run: () => navigate({ to: '/agenda' }),
      },
      {
        kind: 'action',
        id: 'open-meetings',
        label: t('palette.actions.openMeetings'),
        hint: 'Win+Shift+M',
        run: () => navigate({ to: '/meetings' }),
      },
      {
        kind: 'action',
        id: 'toggle-theme',
        label: t('palette.actions.toggleTheme'),
        run: () => {
          const pref = getThemePreference();
          const resolved = pref === 'auto' ? systemTheme() : pref;
          const next = resolved === 'dark' ? 'light' : 'dark';
          setThemePreference(next);
          applyTheme(next);
        },
      },
      {
        kind: 'action',
        id: 'open-settings',
        label: t('palette.actions.openSettings'),
        hint: 'Ctrl+,',
        run: () => navigate({ to: '/settings' }),
      },
    ],
    [navigate, newNote, t],
  );

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recent = notes.slice(0, 5).map<PaletteRow>((n) => ({
        kind: 'note',
        id: n.id,
        label: n.title || t('sidebar.untitled'),
      }));
      return [
        ...(recent.length ? [{ label: t('palette.sections.notes'), items: recent }] : []),
        { label: t('palette.sections.actions'), items: actions },
      ];
    }
    const noteHits = notes
      .filter((n) => (n.title || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map<PaletteRow>((n) => ({
        kind: 'note',
        id: n.id,
        label: n.title || t('sidebar.untitled'),
      }));
    const actionHits = actions.filter((a) => a.label.toLowerCase().includes(q));
    return [
      ...(noteHits.length ? [{ label: t('palette.sections.notes'), items: noteHits }] : []),
      ...(actionHits.length ? [{ label: t('palette.sections.actions'), items: actionHits }] : []),
    ];
  }, [query, notes, actions, t]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => setCursor(0), [query]);

  function pick(row: PaletteRow) {
    onClose();
    if (row.kind === 'action') {
      row.run();
    } else {
      void navigate({ to: '/notes/$noteId', params: { noteId: row.id } });
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((v) => Math.min(flat.length - 1, v + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((v) => Math.max(0, v - 1));
    }
    if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault();
      pick(flat[cursor]);
    }
  }

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center px-4 pt-[14vh] bg-foreground/10 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[560px] max-h-[60vh] flex flex-col overflow-hidden rounded-[16px] border border-border bg-popover/80 backdrop-blur-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title')}
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border">
          <Search
            size={17}
            className="text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="cx-kbd">Esc</kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
          {flat.length === 0 && (
            <div className="px-4 py-7 text-center text-sm text-muted-foreground">
              {t('palette.empty', { query })}
            </div>
          )}
          {groups.map((group) => (
            <div key={group.label} className="py-1.5">
              <div className="cx-eyebrow px-2.5 pt-1.5 pb-1">{group.label}</div>
              {group.items.map((item) => {
                flatIdx++;
                const active = flatIdx === cursor;
                const localIdx = flatIdx;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onMouseEnter={() => setCursor(localIdx)}
                    onClick={() => pick(item)}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-sm text-foreground',
                      active && 'bg-secondary/70',
                    )}
                  >
                    {item.kind === 'note' ? (
                      <FileText
                        size={15}
                        className="text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                    ) : item.id === 'open-settings' ? (
                      <Settings
                        size={15}
                        className="text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        size={15}
                        className="text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {item.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex gap-3.5 px-3.5 py-2 border-t border-border text-[11px] text-muted-foreground">
          <span>
            <kbd className="cx-kbd">↑</kbd>
            <kbd className="cx-kbd ml-0.5">↓</kbd> {t('palette.hints.navigate')}
          </span>
          <span>
            <kbd className="cx-kbd">↵</kbd> {t('palette.hints.open')}
          </span>
          <span>
            <kbd className="cx-kbd">Esc</kbd> {t('palette.hints.close')}
          </span>
        </div>
      </div>
    </div>
  );
}
