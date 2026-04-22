import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, PanelLeft, PanelRight } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useSidePanel } from '../../lib/panels';
import { Breadcrumb } from './Breadcrumb';
import { ChromeTabs, type ChromeTab } from './ChromeTabs';

export interface ChromeCapProps {
  trail?: string[];
  tabs?: ChromeTab[];
  left?: ReactNode;
  right?: ReactNode;
  onToggleRail?: () => void;
  hasSidePanel?: boolean;
}

export function ChromeCap({
  trail,
  tabs,
  left,
  right,
  onToggleRail,
  hasSidePanel,
}: ChromeCapProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const toggleSidePanel = useSidePanel((s) => s.toggle);
  const sidePanelOpen = useSidePanel((s) => s.open);

  return (
    <header
      className="shrink-0 flex items-center gap-2 px-3 border-b border-border bg-background"
      style={{ height: 'var(--shell-chrome-height)' }}
    >
      <div className="flex items-center gap-1 shrink-0">
        {onToggleRail && (
          <IconButton
            icon={<PanelLeft size={16} aria-hidden="true" />}
            label={t('chrome.toggleRail')}
            onClick={onToggleRail}
          />
        )}
        <IconButton
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          label={t('chrome.back')}
          onClick={() => router.history.back()}
        />
        <IconButton
          icon={<ArrowRight size={16} aria-hidden="true" />}
          label={t('chrome.forward')}
          onClick={() => router.history.forward()}
        />
      </div>

      {tabs && tabs.length > 0 && <ChromeTabs tabs={tabs} />}

      {left}

      {trail && trail.length > 0 && <Breadcrumb trail={trail} />}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {right}
        {hasSidePanel && (
          <IconButton
            icon={<PanelRight size={16} aria-hidden="true" />}
            label={t('sidePanel.toggle')}
            onClick={toggleSidePanel}
            active={sidePanelOpen}
          />
        )}
      </div>
    </header>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={
        'w-7 h-7 rounded-md flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
        (active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60')
      }
    >
      {icon}
    </button>
  );
}
