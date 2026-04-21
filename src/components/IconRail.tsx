import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  Calendar,
  FileText,
  Mic,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import {
  applyTheme,
  getThemePreference,
  setThemePreference,
  systemTheme,
} from '../lib/theme';
import { useResolvedTheme } from '../lib/useTheme';

interface Props {
  onOpenPalette: () => void;
}

type RouteView = 'notes' | 'agenda' | 'meetings' | 'settings';

/**
 * 44 px slim icon rail that replaces the old 280 px sidebar.
 * Matches the Claude Design handoff: pages / agenda / meetings /
 * search at top; theme toggle + settings at the bottom. Every
 * affordance is a 30 px square button; labels live only in the
 * hover tooltip so the rail stays quiet.
 */
export function IconRail({ onOpenPalette }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (s) => s.pathname });
  const view = viewFromPath(pathname);
  const resolvedTheme = useResolvedTheme();

  return (
    <aside
      className="w-11 shrink-0 h-full flex flex-col items-center py-2 gap-0.5 border-r border-border bg-background"
      aria-label={t('a11y.mainNavigation')}
    >
      <Logo />
      <Spacer className="h-2" />
      <RailButton
        icon={<FileText size={18} aria-hidden="true" />}
        label={t('nav.notes')}
        active={view === 'notes'}
        onClick={() => navigate({ to: '/notes' })}
      />
      <RailButton
        icon={<Calendar size={18} aria-hidden="true" />}
        label={t('nav.agenda')}
        active={view === 'agenda'}
        onClick={() => navigate({ to: '/agenda' })}
      />
      <RailButton
        icon={<Mic size={18} aria-hidden="true" />}
        label={t('nav.meetings')}
        active={view === 'meetings'}
        onClick={() => navigate({ to: '/meetings' })}
      />
      <RailButton
        icon={<Search size={18} aria-hidden="true" />}
        label={t('rail.search')}
        onClick={onOpenPalette}
      />

      <div className="flex-1" />

      <RailButton
        icon={
          resolvedTheme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )
        }
        label={t('rail.toggleTheme')}
        onClick={toggleTheme}
      />
      <RailButton
        icon={<Settings size={18} aria-hidden="true" />}
        label={t('nav.settings')}
        active={view === 'settings'}
        onClick={() => navigate({ to: '/settings' })}
      />
    </aside>
  );
}

function Logo() {
  return (
    <div
      className="w-6 h-6 rounded-full mt-1 mb-1 shrink-0"
      style={{ background: 'oklch(var(--accent))' }}
      aria-hidden="true"
    />
  );
}

function Spacer({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

function RailButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'w-[30px] h-[30px] rounded-md flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
      )}
    >
      {icon}
    </button>
  );
}

function viewFromPath(pathname: string): RouteView {
  if (pathname.startsWith('/agenda')) return 'agenda';
  if (pathname.startsWith('/meetings')) return 'meetings';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'notes';
}

function toggleTheme() {
  const pref = getThemePreference();
  const resolved = pref === 'auto' ? systemTheme() : pref;
  const next = resolved === 'dark' ? 'light' : 'dark';
  setThemePreference(next);
  applyTheme(next);
}
