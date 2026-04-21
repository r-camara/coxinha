import { ReactNode } from 'react';

import { ChromeBar } from './ChromeBar';
import { StatusBar } from './StatusBar';

interface Props {
  trail: string[];
  chromeRight?: ReactNode;
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  /** Hide the footer status bar entirely. */
  hideStatus?: boolean;
  children: ReactNode;
}

/**
 * Standard chrome for every top-level route: 52 px breadcrumb bar
 * above, 36 px status bar below, content in between. Matches the
 * Mix B Refined handoff; see docs/research/ui-audit/DESIGN.md.
 */
export function RouteLayout({
  trail,
  chromeRight,
  statusLeft,
  statusRight,
  hideStatus = false,
  children,
}: Props) {
  return (
    <div className="h-full flex flex-col">
      <ChromeBar trail={trail} right={chromeRight} />
      <section className="flex-1 min-h-0 overflow-hidden">{children}</section>
      {!hideStatus && <StatusBar left={statusLeft} right={statusRight} />}
    </div>
  );
}
