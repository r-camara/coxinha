import { ReactNode } from 'react';

interface Props {
  /** Left-aligned status text (e.g. "847 palavras · 6 min · Saved"). */
  left?: ReactNode;
  /** Right-aligned text (e.g. locale indicator). */
  right?: ReactNode;
}

/**
 * 36 px footer bar shown below route content, per the Mix B
 * Refined handoff. Word count / save state on the left, optional
 * meta on the right.
 */
export function StatusBar({ left, right }: Props) {
  return (
    <footer className="h-9 shrink-0 flex items-center px-6 border-t border-border bg-background cx-status">
      {left}
      {right && <div className="ml-auto">{right}</div>}
    </footer>
  );
}
