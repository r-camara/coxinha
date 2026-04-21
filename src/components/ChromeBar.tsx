import { ReactNode } from 'react';

interface Props {
  /**
   * Breadcrumb segments. The last entry renders bold in primary
   * ink; earlier entries are muted with a thin slash separator.
   */
  trail: string[];
  /** Optional right-side slot (save indicator, zoom, etc). */
  right?: ReactNode;
}

/**
 * 52 px chrome bar shown above every route, per the Mix B Refined
 * handoff. Breadcrumb on the left, arbitrary slot on the right,
 * bottom border to separate from the content column below.
 */
export function ChromeBar({ trail, right }: Props) {
  return (
    <header className="h-[52px] shrink-0 flex items-center gap-3 px-6 border-b border-border bg-background">
      <nav className="flex items-center gap-1.5 cx-crumb min-w-0">
        {trail.map((seg, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="cx-crumb-sep">/</span>}
              <span
                className={isLast ? 'cx-crumb-active truncate' : 'truncate'}
                title={seg}
              >
                {seg}
              </span>
            </span>
          );
        })}
      </nav>
      {right && (
        <div className="ml-auto flex items-center gap-3 shrink-0">{right}</div>
      )}
    </header>
  );
}

/**
 * The small "● Saved" cluster used on the right side of ChromeBar
 * when a route is editing user content (notes, recordings).
 */
export function SavedIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 cx-status">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: 'oklch(var(--accent))' }}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
