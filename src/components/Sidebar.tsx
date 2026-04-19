import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { Calendar, FileText, Mic, Settings } from 'lucide-react';
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

  return (
    <aside className="w-72 border-r border-[hsl(var(--border))] flex flex-col bg-[hsl(var(--muted))]">
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
          className="text-xs px-2 py-1 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
        <div className="flex-1 overflow-auto px-2 mt-4">
          <h2 className="text-xs uppercase text-[hsl(var(--muted-foreground))] px-2 mb-1">
            {t('sidebar.recentHeading')}
          </h2>
          <ul aria-label={t('a11y.noteList')} className="space-y-0.5">
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setActiveNote(n.id)}
                  aria-current={activeNoteId === n.id ? 'page' : undefined}
                  className={clsx(
                    'w-full text-left px-2 py-1.5 rounded text-sm truncate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                    activeNoteId === n.id
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                      : 'hover:bg-[hsl(var(--accent))]/50'
                  )}
                >
                  {n.title || t('sidebar.untitled')}
                </button>
              </li>
            ))}
          </ul>
          {notes.length === 0 && (
            <p className="px-2 text-sm text-[hsl(var(--muted-foreground))]">
              {t('sidebar.emptyState')}
            </p>
          )}
        </div>
      )}

      <footer className="p-2 border-t border-[hsl(var(--border))]">
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
          ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium'
          : 'hover:bg-[hsl(var(--accent))]/50'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
