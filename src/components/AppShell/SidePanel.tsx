import { ReactNode } from 'react';

import { useSidePanel } from '../../lib/panels';

interface Props {
  children: ReactNode;
}

export function SidePanel({ children }: Props) {
  const open = useSidePanel((s) => s.open);

  if (!open) return null;

  return (
    <aside
      id="side-panel"
      aria-label="Context panel"
      className="shrink-0 h-full border-l border-border bg-background overflow-y-auto"
      style={{ width: 'var(--shell-panel-width)' }}
    >
      {children}
    </aside>
  );
}
