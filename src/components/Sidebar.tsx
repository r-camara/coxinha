import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { commands, type Note, type TagCount } from '../lib/bindings';
import { Calendar, FileText, Mic, Search, Settings, Tag, X } from 'lucide-react';
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
  const [tags, setTags] = useState<TagCount[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [tagNotes, setTagNotes] = useState<Note[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults(null);
      return;
    }
    // Typing in search drops any active tag filter — last
    // interaction wins, matches Obsidian's behaviour.
    setTagFilter(null);
    const handle = setTimeout(async () => {
      try {
        setResults(await searchNotes(q));
      } catch {
        setResults([]);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [query, searchNotes]);

  useEffect(() => {
    // Refresh tag cloud whenever the notes list changes — a save
    // can introduce a new tag, a delete can drop the last
    // occurrence of one.
    let cancelled = false;
    commands.listTags().then((r) => {
      if (!cancelled && r.status === 'ok') setTags(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [notes]);

  useEffect(() => {
    if (!tagFilter) {
      setTagNotes([]);
      return;
    }
    let cancelled = false;
    commands.listNotesByTag(tagFilter).then((r) => {
      if (!cancelled && r.status === 'ok') setTagNotes(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [tagFilter, notes]);

  const searching = results !== null;
  const filteringByTag = tagFilter !== null;
  const listItems = searching ? results! : filteringByTag ? tagNotes : notes;

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
            <div className="flex items-center justify-between px-2 mb-1">
              <h2 className="text-xs uppercase text-muted-foreground">
                {searching
                  ? t('sidebar.searchResultsHeading')
                  : filteringByTag
                    ? t('sidebar.tagFilteredHeading', { tag: tagFilter })
                    : t('sidebar.recentHeading')}
              </h2>
              {filteringByTag && (
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  aria-label={t('sidebar.tagClear')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
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
                        : 'hover:bg-accent/50',
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
            {!searching && !filteringByTag && notes.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">
                {t('sidebar.emptyState')}
              </p>
            )}
          </div>

          {!searching && (
            <div>
              <h2 className="text-xs uppercase text-muted-foreground px-2 mb-1 flex items-center gap-1.5">
                <Tag size={12} aria-hidden="true" />
                {t('sidebar.tagsHeading')}
              </h2>
              {tags.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">
                  {t('sidebar.tagsEmpty')}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1 px-2">
                  {tags.map((t2) => (
                    <li key={t2.tag}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setTagFilter((prev) => (prev === t2.tag ? null : t2.tag));
                        }}
                        aria-pressed={tagFilter === t2.tag}
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded-full border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                          tagFilter === t2.tag
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:bg-accent/50',
                        )}
                      >
                        #{t2.tag}
                        <span className="ml-1 opacity-70">{t2.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
