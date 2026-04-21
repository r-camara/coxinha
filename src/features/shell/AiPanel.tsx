import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * Right-side AI panel. Two states per Mix B Refined:
 *
 * - Collapsed: 48 px rail with a sparkles icon and vertical "ASK"
 *   label. Click (or ⌘J) expands the full panel.
 * - Expanded: 320 px panel with link / related sections and an
 *   Ask input at the bottom.
 *
 * Real data lands later from spec 0049 (semantic links) and a
 * future AI-chat spec.
 */
export function AiPanel({ open, onToggle, onClose }: Props) {
  const { t } = useTranslation();

  if (!open) {
    return (
      <aside
        className="w-12 shrink-0 h-full border-l border-border bg-secondary flex flex-col items-center py-[18px] gap-4"
        aria-label={t('assistant.region')}
      >
        <button
          type="button"
          onClick={onToggle}
          title={t('assistant.title')}
          aria-label={t('assistant.title')}
          className="w-8 h-8 rounded flex items-center justify-center text-primary hover:bg-accent/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Sparkles size={16} aria-hidden="true" />
        </button>
        <span
          className="cx-eyebrow"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: '0.15em',
          }}
          aria-hidden="true"
        >
          ASK
        </span>
      </aside>
    );
  }

  return (
    <aside
      className="w-[320px] shrink-0 h-full border-l border-border bg-secondary flex flex-col"
      aria-label={t('assistant.region')}
    >
      <header className="flex items-center justify-between h-[52px] px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 cx-eyebrow">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'oklch(var(--accent))',
              boxShadow: '0 0 0 3px oklch(var(--accent-soft))',
            }}
            aria-hidden="true"
          />
          {t('assistant.title')}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('assistant.close')}
          className="text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px]"
          title="Ctrl+J"
        >
          ⌘J
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-[22px] min-h-0">
        <Section title={t('assistant.links')} />
        <Section title={t('assistant.related')} />
      </div>

      <div className="border-t border-border px-3 py-3 shrink-0">
        <div className="flex items-center gap-2 h-9 px-3 rounded bg-background border border-input focus-within:border-primary/50 transition-colors">
          <Sparkles
            size={14}
            className="text-primary shrink-0"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={t('assistant.askPlaceholder')}
            aria-label={t('assistant.askPlaceholder')}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="cx-kbd">⌘J</kbd>
        </div>
      </div>
    </aside>
  );
}

function Section({ title, className }: { title: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <section className={clsx('flex flex-col gap-2', className)}>
      <div className="cx-eyebrow">{title}</div>
      <p className="text-sm text-muted-foreground italic">
        {t('assistant.empty')}
      </p>
    </section>
  );
}
