import {
  Calendar,
  FileText,
  Home,
  Inbox,
  Mic,
  MoreHorizontal,
  Search,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../lib/store';
import { RailItem } from './RailItem';
import { RailSection } from './RailSection';

export interface RailProps {
  onOpenPalette?: () => void;
  onNewMeetingNote?: () => void;
  /** Fixed list of AI meeting notes to surface (fixtures or derived). */
  meetingNotes?: Array<{ id: string; title: string }>;
  /** Override the recents list (dev preview); defaults to store.notes. */
  recents?: Array<{ id: string; title: string }>;
}

export function Rail({
  onOpenPalette,
  onNewMeetingNote,
  meetingNotes = [],
  recents,
}: RailProps) {
  const { t } = useTranslation();
  const storeNotes = useAppStore((s) => s.notes);

  const shownRecents =
    recents ??
    storeNotes
      .slice()
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 8)
      .map((n) => ({ id: n.id, title: n.title || t('sidebar.untitled') }));

  return (
    <aside
      className="shrink-0 h-full flex flex-col border-r border-border bg-background"
      style={{ width: 'var(--shell-rail-width)' }}
      aria-label={t('rail.workspace')}
    >
      <div className="px-2 pt-2 pb-1 flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold text-primary-foreground"
          style={{ backgroundColor: 'oklch(var(--accent))' }}
          aria-hidden="true"
        >
          C
        </div>
        <span className="text-sm font-medium truncate">{t('brand.name')}</span>
        <button
          type="button"
          aria-label={t('rail.workspaceOptions')}
          className="ml-auto w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center justify-center"
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label={t('a11y.mainNavigation')}
        className="px-2 flex flex-col gap-0.5 overflow-y-auto"
      >
        <RailItem
          icon={<Home size={14} aria-hidden="true" />}
          label={t('nav.home')}
          to="/"
        />

        <div className="flex items-center gap-1 px-1 py-2">
          <QuickIcon
            label={t('rail.quick.messages')}
            icon={<Inbox size={16} aria-hidden="true" />}
          />
          <QuickIcon
            label={t('rail.quick.agenda')}
            icon={<Calendar size={16} aria-hidden="true" />}
            to="/agenda"
          />
          <QuickIcon
            label={t('rail.quick.notes')}
            icon={<FileText size={16} aria-hidden="true" />}
            to="/notes"
          />
          <QuickIcon
            label={t('rail.search')}
            icon={<Search size={16} aria-hidden="true" />}
            onClick={onOpenPalette}
          />
        </div>

        <RailSection title={t('rail.sections.aiMeetingNotes')}>
          {meetingNotes.length === 0 ? (
            <div className="px-2 py-1 text-[12px] text-muted-foreground/70">
              {t('rail.aiMeetingEmpty')}
            </div>
          ) : (
            meetingNotes.map((n) => (
              <RailItem
                key={n.id}
                icon={<FileText size={14} aria-hidden="true" />}
                label={n.title}
                to={`/notes/${n.id}`}
              />
            ))
          )}
          <RailItem
            icon={<Mic size={14} aria-hidden="true" />}
            label={t('rail.newMeetingNote')}
            onClick={onNewMeetingNote}
          />
        </RailSection>

        <RailSection title={t('rail.sections.recents')}>
          {shownRecents.length === 0 ? (
            <div className="px-2 py-1 text-[12px] text-muted-foreground/70">
              {t('rail.recentsEmpty')}
            </div>
          ) : (
            shownRecents.map((n) => (
              <RailItem
                key={n.id}
                icon={<FileText size={14} aria-hidden="true" />}
                label={n.title}
                to={`/notes/${n.id}`}
              />
            ))
          )}
        </RailSection>
      </nav>

      <div className="mt-auto p-2 border-t border-border">
        <RailItem
          icon={<Settings size={14} aria-hidden="true" />}
          label={t('nav.settings')}
          to="/settings"
        />
      </div>
    </aside>
  );
}

function QuickIcon({
  label,
  icon,
  onClick,
  to,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  to?: string;
}) {
  const classes =
    'flex-1 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
  if (to) {
    return (
      <a href={to} aria-label={label} title={label} className={classes}>
        {icon}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={classes}
    >
      {icon}
    </button>
  );
}
