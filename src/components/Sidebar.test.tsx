import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

// Minimal store mock — Sidebar reads notes + activeNoteId + the
// two actions it still calls (`newNote`, `searchNotes`).
// `setActiveNote` stays on the store API but the component now
// routes directly, so it is not asserted here.
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

const listTags = vi.fn();
const listNotesByTag = vi.fn();
vi.mock('../lib/bindings', () => ({
  commands: {
    listTags: (...a: unknown[]) => listTags(...a),
    listNotesByTag: (...a: unknown[]) => listNotesByTag(...a),
  },
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
  listTags.mockReset();
  listNotesByTag.mockReset();
  navigate.mockReset();
  listTags.mockResolvedValue({ status: 'ok', data: [] });
  listNotesByTag.mockResolvedValue({ status: 'ok', data: [] });
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
    await new Promise((r) => setTimeout(r, 200));

    expect(storeState.searchNotes).not.toHaveBeenCalled();
  });
});

describe('Sidebar — tags', () => {
  it('renders tag pills with counts fetched from the backend', async () => {
    listTags.mockResolvedValue({
      status: 'ok',
      data: [
        { tag: 'project', count: 3 },
        { tag: 'idea', count: 1 },
      ],
    });

    render(<Sidebar current="notes" onNavigate={() => {}} />);

    expect(await screen.findByRole('button', { name: /#project/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /#idea/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /#project/ }).textContent).toContain('3');
  });

  it('filters the list to tag-matching notes when a pill is clicked', async () => {
    const user = userEvent.setup();
    listTags.mockResolvedValue({
      status: 'ok',
      data: [{ tag: 'project', count: 2 }],
    });
    listNotesByTag.mockResolvedValue({
      status: 'ok',
      data: [note('p1', 'Project plan')],
    });

    render(<Sidebar current="notes" onNavigate={() => {}} />);
    const pill = await screen.findByRole('button', { name: /#project/ });
    await user.click(pill);

    await waitFor(() => expect(listNotesByTag).toHaveBeenCalledWith('project'));
    expect(await screen.findByText('Project plan')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(pill).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears the tag filter when the clear button is clicked', async () => {
    const user = userEvent.setup();
    listTags.mockResolvedValue({
      status: 'ok',
      data: [{ tag: 'project', count: 1 }],
    });
    listNotesByTag.mockResolvedValue({
      status: 'ok',
      data: [note('p1', 'Project plan')],
    });

    render(<Sidebar current="notes" onNavigate={() => {}} />);
    await user.click(await screen.findByRole('button', { name: /#project/ }));
    await screen.findByText('Project plan');

    await user.click(screen.getByRole('button', { name: 'sidebar.tagClear' }));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Project plan')).not.toBeInTheDocument();
  });
});

describe('Sidebar — note click', () => {
  it('navigates to /notes/$noteId when a note is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar current="notes" onNavigate={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(navigate).toHaveBeenCalledWith({
      to: '/notes/$noteId',
      params: { noteId: 'a' },
    });
  });

  it('creates a draft and navigates on the "+ New" button', async () => {
    const user = userEvent.setup();
    storeState.newNote.mockResolvedValue(note('new-1', ''));

    render(<Sidebar current="notes" onNavigate={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'a11y.newNote' }));

    await waitFor(() => expect(storeState.newNote).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith({
      to: '/notes/$noteId',
      params: { noteId: 'new-1' },
    });
  });
});
