/**
 * Telemetria local do fluxo "Ctrl+Alt+N → cursor no editor".
 *
 * Usa `performance.mark` + `performance.measure` do browser
 * — zero overhead em produção (sem dev tools aberto os marks
 * ficam no buffer interno e podem ser descartados).
 *
 * **Como ler os números:** abra o DevTools (F12) no app rodando
 * e aperte Ctrl+Alt+N. A tabela aparece no console. O budget UX
 * é 2 s do aperto até conseguir digitar.
 *
 * Marks emitidos (em ordem):
 *   - new-note:hotkey             — evento `navigate` recebido do Rust
 *   - new-note:create-invoked     — antes do `invoke('create_note')`
 *   - new-note:note-created       — depois do `invoke` retornar
 *   - new-note:editor-suspended   — primeiro render do NoteEditor
 *                                    (Suspense ainda pendente)
 *   - new-note:editor-ready       — `editor.focus()` chamado
 *
 * A cada `new-note:editor-ready`, a função `logNewNoteTrace` é
 * chamada e imprime uma tabela com os deltas.
 */

const PREFIX = 'new-note';

export function mark(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${PREFIX}:${name}`);
}

/**
 * Chamada no final do fluxo (`editor.focus()` landed). Calcula todos
 * os deltas, imprime uma tabela console-friendly, e **limpa os
 * marks** pra que o próximo Ctrl+Alt+N comece do zero.
 */
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
      // Mark ausente = fluxo abortou no meio; ignora.
      rows.push({ step: label, ms: 'n/a' });
    }
  }

  rows.push({ step: 'TOTAL (hotkey → editor-ready)', ms: Math.round(total) });

  // eslint-disable-next-line no-console
  console.group('[perf] new-note trace');
  // eslint-disable-next-line no-console
  console.table(rows);
  if (total > 2000) {
    // eslint-disable-next-line no-console
    console.warn(
      `[perf] new-note EXCEDEU budget (${Math.round(total)}ms > 2000ms)`,
    );
  }
  // eslint-disable-next-line no-console
  console.groupEnd();

  // Limpa pra não vazar entre runs
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
