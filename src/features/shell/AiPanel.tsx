import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Persistent side panel on the right — "Assistant".
 *
 * Visual stub for now. Real data comes later from:
 *   - spec 0049 (semantic link suggestions) for Link suggestions
 *   - a future AI-chat spec for the Ask-anything input
 *
 * Matches the Claude Design handoff layout: ASSISTANT eyebrow
 * with a live status dot, Link suggestions section, Related
 * notes section, and an Ask input at the bottom with the
 * Ctrl+J kbd hint.
 */
export function AiPanel({ open, onClose }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <aside
      className="w-[300px] shrink-0 h-full border-l border-border bg-muted flex flex-col"
      aria-label={t('assistant.region')}
    >
      <header className="flex items-center justify-between h-10 px-4 border-b border-border">
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
        <section className="flex flex-col gap-1.5">
          <div className="cx-eyebrow">{t('assistant.links')}</div>
          <p className="text-sm text-muted-foreground italic">
            {t('assistant.empty')}
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <div className="cx-eyebrow">{t('assistant.related')}</div>
          <p className="text-sm text-muted-foreground italic">
            {t('assistant.empty')}
          </p>
        </section>
      </div>

      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-background/50 focus-within:bg-background transition-colors">
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
