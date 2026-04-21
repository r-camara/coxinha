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
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

const storeState = {
  notes: [] as Array<{ id: string; title: string }>,
  newNote: vi.fn(),
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
  storeState.notes = [
    note('a', 'Alpha architecture'),
    note('b', 'Beta meeting'),
    note('c', 'Gamma retro'),
  ];
  storeState.newNote.mockReset();
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
});
