import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => () => undefined,
}));

import { HomeCanvas } from './HomeCanvas';
import { homeFixture } from './fixtures';

describe('HomeCanvas', () => {
  it('renders the greeting with the user first name', () => {
    render(<HomeCanvas />);
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent(homeFixture.userFirstName);
  });

  it('renders every fixture thing-card', () => {
    render(<HomeCanvas />);
    for (const card of homeFixture.thingsToday) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it('renders every recent note', () => {
    render(<HomeCanvas />);
    for (const r of homeFixture.recents) {
      expect(screen.getByText(r.title)).toBeInTheDocument();
    }
  });
});
