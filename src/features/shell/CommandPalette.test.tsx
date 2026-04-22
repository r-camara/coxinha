import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, string>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}));

const navigate = vi.fn();
const pathname = { current: '/notes' };
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useLocation: <T,>(opts: { select: (s: { pathname: string }) => T }) =>
    opts.select({ pathname: pathname.current }),
}));

const storeState = {
  notes: [] as Array<{ id: string; title: string }>,
  newNote: vi.fn(),
  deleteNote: vi.fn(),
};

vi.mock('../../lib/store', () => ({
  useAppStore: <T,>(selector: (s: typeof storeState) => T) =>
    selector(storeState),
}));

vi.mock('../../lib/theme', () => ({
  applyTheme: vi.fn(),
  getThemePreference: vi.fn(() => 'light'),
  setThemePreference: vi.fn(),
  systemTheme: vi.fn(() => 'light'),
}));

import { CommandPalette } from './CommandPalette';

function note(id: string, title: string) {
  return { id, title };
}

beforeEach(() => {
  navigate.mockReset();
  pathname.current = '/notes';
  storeState.notes = [
    note('a', 'Alpha architecture'),
    note('b', 'Beta meeting'),
    note('c', 'Gamma retro'),
  ];
  storeState.newNote.mockReset();
  storeState.deleteNote.mockReset();
});

describe('CommandPalette', () => {
  it('returns null when closed', () => {
    const { container } = render(<CommandPalette open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders actions and recent notes when open with empty query', () => {
    render(<CommandPalette open onClose={() => {}} />);
    expect(screen.getByText('palette.actions.newNote')).toBeInTheDocument();
    expect(screen.getByText('palette.actions.openAgenda')).toBeInTheDocument();
    expect(screen.getByText('Alpha architecture')).toBeInTheDocument();
  });

  it('filters notes by typed query', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onClose={() => {}} />);

    await user.type(screen.getByPlaceholderText('palette.placeholder'), 'meeting');
    expect(screen.getByText('Beta meeting')).toBeInTheDocument();
    expect(screen.queryByText('Alpha architecture')).not.toBeInTheDocument();
  });

  it('navigates to a note when picked', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onClose={() => {}} />);

    await user.click(screen.getByText('Alpha architecture'));
    expect(navigate).toHaveBeenCalledWith({
      to: '/notes/$noteId',
      params: { noteId: 'a' },
    });
  });

  it('fires the action when an action row is picked', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onClose={() => {}} />);

    await user.click(screen.getByText('palette.actions.openAgenda'));
    expect(navigate).toHaveBeenCalledWith({ to: '/agenda' });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);
    // Type in the input then Escape — the handler is on the dialog itself.
    const input = screen.getByPlaceholderText('palette.placeholder');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('surfaces an empty-state message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onClose={() => {}} />);
    await user.type(screen.getByPlaceholderText('palette.placeholder'), 'xyzzz');
    expect(
      screen.getByText(/palette\.empty/),
    ).toBeInTheDocument();
  });

  it('exposes a Delete-this-note action only on note-detail routes', () => {
    pathname.current = '/notes/b';
    render(<CommandPalette open onClose={() => {}} />);
    expect(
      screen.getByText('palette.actions.deleteCurrentNote'),
    ).toBeInTheDocument();
  });

  it('hides the Delete-this-note action on non-detail routes', () => {
    pathname.current = '/settings';
    render(<CommandPalette open onClose={() => {}} />);
    expect(
      screen.queryByText('palette.actions.deleteCurrentNote'),
    ).not.toBeInTheDocument();
  });

  it('calls deleteNote when the user confirms the row trash icon', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CommandPalette open onClose={() => {}} />);

    // Every note row has a Delete button — grab them all, pick Beta's.
    const buttons = screen.getAllByRole('button', {
      name: 'palette.actions.deleteThisNote',
    });
    expect(buttons).toHaveLength(3);
    await user.click(buttons[1]);

    expect(storeState.deleteNote).toHaveBeenCalledWith('b');
    confirmSpy.mockRestore();
  });

  it('skips deletion when the user cancels the confirm', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CommandPalette open onClose={() => {}} />);

    const [firstDelete] = screen.getAllByRole('button', {
      name: 'palette.actions.deleteThisNote',
    });
    await user.click(firstDelete);

    expect(storeState.deleteNote).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
