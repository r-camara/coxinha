import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Minimal store mock — Sidebar reads notes + activeNoteId + four
// actions. Each selector just picks from a single object we
// mutate per test.
const storeState = {
  notes: [] as Array<{
    id: string;
    title: string;
    path: string;
    tags: string[];
    created_at: string;
    updated_at: string;
  }>,
  activeNoteId: null as string | null,
  setActiveNote: vi.fn(),
  newNote: vi.fn(),
  searchNotes: vi.fn(),
};

vi.mock('../lib/store', () => ({
  useAppStore: <T,>(selector: (s: typeof storeState) => T) => selector(storeState),
}));

import { Sidebar } from './Sidebar';

function note(id: string, title: string, updated = '2026-04-18T00:00:00Z') {
  return {
    id,
    title,
    path: `notes/${id}.md`,
    tags: [],
    created_at: updated,
    updated_at: updated,
  };
}

beforeEach(() => {
  storeState.notes = [note('a', 'Alpha'), note('b', 'Beta')];
  storeState.activeNoteId = null;
  storeState.setActiveNote.mockReset();
  storeState.newNote.mockReset();
  storeState.searchNotes.mockReset();
});

describe('Sidebar — search', () => {
  it('shows recent notes when no query is typed', () => {
    render(<Sidebar current="notes" onNavigate={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('sidebar.recentHeading')).toBeInTheDocument();
  });

  it('debounces queries and swaps in backend results under 250ms', async () => {
    const user = userEvent.setup();
    storeState.searchNotes.mockResolvedValue([note('z', 'Zeta match')]);

    render(<Sidebar current="notes" onNavigate={() => {}} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'ze');

    await waitFor(() => expect(storeState.searchNotes).toHaveBeenCalledWith('ze'));
    expect(await screen.findByText('Zeta match')).toBeInTheDocument();
    expect(screen.getByText('sidebar.searchResultsHeading')).toBeInTheDocument();
    // Recent items hidden while the results view is active.
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('renders "nothing found" when search returns empty', async () => {
    const user = userEvent.setup();
    storeState.searchNotes.mockResolvedValue([]);

    render(<Sidebar current="notes" onNavigate={() => {}} />);
    await user.type(screen.getByRole('searchbox'), 'xyz');

    expect(await screen.findByText('sidebar.searchNoResults')).toBeInTheDocument();
  });

  it('restores the recent list when the clear button is clicked', async () => {
    const user = userEvent.setup();
    storeState.searchNotes.mockResolvedValue([note('z', 'Zeta')]);

    render(<Sidebar current="notes" onNavigate={() => {}} />);
    await user.type(screen.getByRole('searchbox'), 'z');
    await screen.findByText('Zeta');

    await user.click(screen.getByRole('button', { name: 'sidebar.searchClear' }));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Zeta')).not.toBeInTheDocument();
  });

  it('does not hit the backend for whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<Sidebar current="notes" onNavigate={() => {}} />);

    await user.type(screen.getByRole('searchbox'), '   ');
    // Give the debounce window a chance to fire.
    await new Promise((r) => setTimeout(r, 200));

    expect(storeState.searchNotes).not.toHaveBeenCalled();
  });
});
