/**
 * Local timing for the "Ctrl+Alt+N → cursor in editor" flow.
 *
 * To read the numbers: open DevTools (F12) and hit Ctrl+Alt+N.
 * The breakdown lands in the console. UX budget is 2 s total.
 *
 * Marks, in order:
 *   - new-note:hotkey            — navigate event arrived from Rust
 *   - new-note:create-invoked    — just before invoke('create_note')
 *   - new-note:note-created      — invoke resolved
 *   - new-note:editor-suspended  — NoteEditor first render
 *   - new-note:editor-ready      — editor.focus() landed
 */

const PREFIX = 'new-note';

export function mark(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${PREFIX}:${name}`);
}

export function logNewNoteTrace(): void {
  if (typeof performance === 'undefined') return;

  const steps: Array<[string, string, string]> = [
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
      // Mark missing — flow aborted mid-way. Still render the row.
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

  for (const name of [
    'hotkey',
    'create-invoked',
    'note-created',
    'editor-suspended',
    'editor-ready',
  ]) {
    performance.clearMarks(`${PREFIX}:${name}`);
  }
  for (const [label] of steps) {
    performance.clearMeasures(`${PREFIX}:${label}`);
  }
}
