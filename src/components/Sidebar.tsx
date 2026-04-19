import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import type { Note } from '../lib/bindings';
import { Calendar, FileText, Mic, Search, Settings, X } from 'lucide-react';
import clsx from 'clsx';

type View = 'notes' | 'agenda' | 'meetings' | 'settings';

interface Props {
  current: View;
  onNavigate: (v: View) => void;
}

export function Sidebar({ current, onNavigate }: Props) {
  const { t } = useTranslation();
  const notes = useAppStore((s) => s.notes);
  const activeNoteId = useAppStore((s) => s.activeNoteId);
  const setActiveNote = useAppStore((s) => s.setActiveNote);
  const newNote = useAppStore((s) => s.newNote);
  const searchNotes = useAppStore((s) => s.searchNotes);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setResults(await searchNotes(q));
      } catch {
        // Backend errors surface as empty — the user sees
        // "Nothing found"; no toast while they're mid-typing.
        setResults([]);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [query, searchNotes]);

  const searching = results !== null;
  const listItems = results ?? notes;

  return (
    <aside className="w-72 border-r border-border flex flex-col bg-muted/50">
      <header className="p-4 flex items-center justify-between">
        {/* The main page owns the document's <h1>; the sidebar's brand
            stays a visual-only label so screen-reader headings don't
            compete with view titles. */}
        <span className="font-bold text-lg" aria-label={t('brand.name')}>
          {t('brand.name')}
        </span>
        <button
          type="button"
          onClick={() => newNote()}
          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          title={t('sidebar.newNoteTooltip')}
          aria-label={t('a11y.newNote')}
        >
          {t('sidebar.newNoteButton')}
        </button>
      </header>

      <nav aria-label={t('a11y.mainNavigation')} className="px-2 space-y-1">
        <NavItem
          icon={<FileText size={16} aria-hidden="true" />}
          label={t('nav.notes')}
          active={current === 'notes'}
          onClick={() => onNavigate('notes')}
        />
        <NavItem
          icon={<Calendar size={16} aria-hidden="true" />}
          label={t('nav.agenda')}
          active={current === 'agenda'}
          onClick={() => onNavigate('agenda')}
        />
        <NavItem
          icon={<Mic size={16} aria-hidden="true" />}
          label={t('nav.meetings')}
          active={current === 'meetings'}
          onClick={() => onNavigate('meetings')}
        />
      </nav>

      {current === 'notes' && (
        <div className="flex-1 overflow-auto px-2 mt-4 space-y-3">
          <div className="relative px-2">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('sidebar.searchPlaceholder')}
              aria-label={t('sidebar.searchPlaceholder')}
              className="w-full rounded border border-border bg-background pl-7 pr-7 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('sidebar.searchClear')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div>
            <h2 className="text-xs uppercase text-muted-foreground px-2 mb-1">
              {searching
                ? t('sidebar.searchResultsHeading')
                : t('sidebar.recentHeading')}
            </h2>
            <ul aria-label={t('a11y.noteList')} className="space-y-0.5">
              {listItems.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setActiveNote(n.id)}
                    aria-current={activeNoteId === n.id ? 'page' : undefined}
                    className={clsx(
                      'w-full text-left px-2 py-1.5 rounded text-sm truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                      activeNoteId === n.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    {n.title || t('sidebar.untitled')}
                  </button>
                </li>
              ))}
            </ul>
            {searching && listItems.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">
                {t('sidebar.searchNoResults')}
              </p>
            )}
            {!searching && notes.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">
                {t('sidebar.emptyState')}
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="p-2 border-t border-border">
        <NavItem
          icon={<Settings size={16} aria-hidden="true" />}
          label={t('nav.settings')}
          active={current === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </footer>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'hover:bg-accent/50'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
