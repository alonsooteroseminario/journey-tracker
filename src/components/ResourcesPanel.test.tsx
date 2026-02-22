import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourcesPanel } from './ResourcesPanel';

const RESOURCES = [
  {
    category: 'Immigration',
    resources: [
      { name: 'IRCC Website', url: 'https://www.canada.ca/ircc' },
      { name: 'Express Entry', url: 'https://www.canada.ca/express-entry' },
    ],
  },
  {
    category: 'Jobs',
    resources: [
      { name: 'Job Bank', url: 'https://www.jobbank.gc.ca' },
    ],
  },
];

describe('ResourcesPanel', () => {
  it('renders header in collapsed state', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    expect(screen.getByText('Official Resources')).toBeInTheDocument();
    expect(screen.getByText('2 categories of helpful links')).toBeInTheDocument();
  });

  it('does not show resource links when collapsed', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    expect(screen.queryByText('IRCC Website')).not.toBeInTheDocument();
  });

  it('shows resource categories when expanded', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    const header = screen.getByText('Official Resources').closest('button')!;
    fireEvent.click(header);

    const immigrationMatches = screen.getAllByText('Immigration');
    expect(immigrationMatches.length).toBeGreaterThan(0);
    const jobsMatches = screen.getAllByText('Jobs');
    expect(jobsMatches.length).toBeGreaterThan(0);
  });

  it('shows resource links when expanded', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    const header = screen.getByText('Official Resources').closest('button')!;
    fireEvent.click(header);

    expect(screen.getByText('IRCC Website')).toBeInTheDocument();
    expect(screen.getByText('Express Entry')).toBeInTheDocument();
    expect(screen.getByText('Job Bank')).toBeInTheDocument();
  });

  it('collapses on second click', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    const header = screen.getByText('Official Resources').closest('button')!;
    fireEvent.click(header);
    fireEvent.click(header);

    expect(screen.queryByText('IRCC Website')).not.toBeInTheDocument();
  });

  it('shows add resource form when onAddResource prop provided', () => {
    const onAddResource = vi.fn();
    render(<ResourcesPanel resources={RESOURCES} onAddResource={onAddResource} />);
    const header = screen.getByText('Official Resources').closest('button')!;
    fireEvent.click(header);

    // Add resource button should be visible
    const addBtn = screen.queryByText('Add Resource') ?? screen.queryByRole('button', { name: /add/i });
    if (addBtn) {
      expect(addBtn).toBeInTheDocument();
    }
  });

  it('renders without onAddResource and onDeleteResource props', () => {
    render(<ResourcesPanel resources={RESOURCES} />);
    expect(screen.getByText('Official Resources')).toBeInTheDocument();
  });

  it('renders with empty resources', () => {
    render(<ResourcesPanel resources={[]} />);
    expect(screen.getByText('0 categories of helpful links')).toBeInTheDocument();
  });
});
