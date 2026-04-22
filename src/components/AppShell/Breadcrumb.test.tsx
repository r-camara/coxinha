import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('returns null for an empty trail', () => {
    const { container } = render(<Breadcrumb trail={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each segment in order', () => {
    render(<Breadcrumb trail={['workspace', 'notes', 'VC 15/jan']} />);
    expect(screen.getByText('workspace')).toBeInTheDocument();
    expect(screen.getByText('notes')).toBeInTheDocument();
    expect(screen.getByText('VC 15/jan')).toBeInTheDocument();
  });

  it('renders a separator between segments but not before the first', () => {
    render(<Breadcrumb trail={['a', 'b', 'c']} />);
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });
});
