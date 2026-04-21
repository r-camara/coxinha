import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ChromeBar, SavedIndicator } from './ChromeBar';

describe('ChromeBar', () => {
  it('renders every trail segment in order', () => {
    render(<ChromeBar trail={['notes', 'Reuniao.md']} />);
    const nav = screen.getByRole('navigation');
    expect(nav.textContent?.replace(/\s+/g, '')).toBe('notes/Reuniao.md');
  });

  it('marks only the last segment as active', () => {
    const { container } = render(
      <ChromeBar trail={['notes', 'meetings', 'kickoff.md']} />,
    );
    const actives = container.querySelectorAll('.cx-crumb-active');
    expect(actives).toHaveLength(1);
    expect(actives[0]).toHaveTextContent('kickoff.md');
  });

  it('renders the right slot when provided', () => {
    render(
      <ChromeBar
        trail={['notes', 'kickoff.md']}
        right={<SavedIndicator label="Saved" />}
      />,
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('skips the slash separator before the first segment', () => {
    const { container } = render(<ChromeBar trail={['notes']} />);
    expect(container.querySelectorAll('.cx-crumb-sep')).toHaveLength(0);
  });
});
