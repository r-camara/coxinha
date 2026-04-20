/**
 * Local timing for the "Ctrl+Alt+N → cursor in editor" flow.
 *
 * To read the numbers: open DevTools (F12) and hit Ctrl+Alt+N.
 * The breakdown lands in the console. UX budget is 2 s total.
 */

const PREFIX = 'new-note';

// Single source of truth for mark names — both `mark()` and the
// trace table type-check against this tuple. Renaming here forces
// updates everywhere at compile time.
const MARKS = [
  'hotkey',
  'create-invoked',
  'note-created',
  'editor-suspended',
  'editor-ready',
] as const;

export type PerfMark = (typeof MARKS)[number];

export function mark(name: PerfMark): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${PREFIX}:${name}`);
}

export function logNewNoteTrace(): void {
  if (typeof performance === 'undefined') return;

  // Without a `hotkey` mark this isn't a new-note flow — just a
  // note-switch firing the same focus effect. Bail out quietly so
  // we don't spam "n/a" rows and don't clear marks that belong to
  // an in-flight flow.
  if (performance.getEntriesByName(`${PREFIX}:hotkey`).length === 0) {
    return;
  }

  const steps: Array<[string, PerfMark, PerfMark]> = [
    ['hotkey → create-invoked', 'hotkey', 'create-invoked'],
    ['create-invoked → note-created (IPC)', 'create-invoked', 'note-created'],
    ['note-created → editor-suspended (render)', 'note-created', 'editor-suspended'],
    ['editor-suspended → editor-ready (Suspense+BlockNote)', 'editor-suspended', 'editor-ready'],
  ];

  const rows: Array<Record<string, string | number>> = [];
  let total = 0;

  for (const [label, from, to] of steps) {
    try {
      const m = performance.measure(
        `${PREFIX}:${label}`,
        `${PREFIX}:${from}`,
        `${PREFIX}:${to}`,
      );
      total += m.duration;
      rows.push({ step: label, ms: Math.round(m.duration) });
    } catch {
      rows.push({ step: label, ms: 'n/a' });
    }
  }

  rows.push({ step: 'TOTAL (hotkey → editor-ready)', ms: Math.round(total) });

  /* eslint-disable no-console */
  console.group('[perf] new-note trace');
  console.table(rows);
  if (total > 2000) {
    console.warn(`[perf] new-note exceeded budget (${Math.round(total)}ms > 2000ms)`);
  }
  console.groupEnd();
  /* eslint-enable no-console */

  for (const name of MARKS) {
    performance.clearMarks(`${PREFIX}:${name}`);
  }
  for (const [label] of steps) {
    performance.clearMeasures(`${PREFIX}:${label}`);
  }
}
