import { ReactNode } from 'react';

import { ChromeCap } from './ChromeCap';
import { Rail } from './Rail';
import { SidePanel } from './SidePanel';
import type { ChromeTab } from './ChromeTabs';

interface Props {
  /** Override the default rail (dev preview + special pages). */
  rail?: ReactNode;
  /** Right-hand context panel. When omitted, it simply doesn't render. */
  sidePanel?: ReactNode;
  /** Breadcrumb segments displayed in the chrome. */
  trail?: string[];
  /** Tab strip — callers pass exactly one tab in this iteration. */
  tabs?: ChromeTab[];
  /** Right-side slot in the chrome (save status, share, more). */
  chromeRight?: ReactNode;
  /** Left-side slot, inserted between nav buttons and breadcrumb. */
  chromeLeft?: ReactNode;
  children: ReactNode;
}

/**
 * Three-column workspace shell: chrome cap (48 px) above a row of
 * rail (256 px) + canvas (flex) + optional side panel (380 px).
 * See spec 0057.
 */
export function AppShell({
  rail,
  sidePanel,
  trail,
  tabs,
  chromeRight,
  chromeLeft,
  children,
}: Props) {
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <a
        href="#canvas"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
      >
        Skip to canvas
      </a>

      <ChromeCap
        trail={trail}
        tabs={tabs}
        left={chromeLeft}
        right={chromeRight}
        hasSidePanel={sidePanel != null}
      />

      <div className="flex-1 min-h-0 flex">
        {rail ?? <Rail />}
        <main id="canvas" className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
        {sidePanel && <SidePanel>{sidePanel}</SidePanel>}
      </div>
    </div>
  );
}
