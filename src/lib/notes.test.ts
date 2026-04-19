import { describe, expect, it } from 'vitest';
import { sortByUpdated } from './notes';
import type { Note } from './bindings';

function note(id: string, updated_at: string): Note {
  return {
    id,
    title: id,
    path: `notes/${id}.md`,
    tags: [],
    created_at: updated_at,
    updated_at,
  } as Note;
}

describe('sortByUpdated', () => {
  it('orders most recent first', () => {
    const older = note('a', '2026-01-01T00:00:00Z');
    const newer = note('b', '2026-04-01T00:00:00Z');
    expect(sortByUpdated([older, newer]).map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('is stable for equal timestamps (does not lose entries)', () => {
    const same = '2026-04-18T00:00:00Z';
    const result = sortByUpdated([note('a', same), note('b', same), note('c', same)]);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((n) => n.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('does not mutate the input array', () => {
    const input = [note('a', '2026-01-01T00:00:00Z'), note('b', '2026-04-01T00:00:00Z')];
    const snapshot = input.map((n) => n.id);
    sortByUpdated(input);
    expect(input.map((n) => n.id)).toEqual(snapshot);
  });
});
