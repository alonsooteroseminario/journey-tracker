import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineComparison } from './TimelineComparison';

const TIMELINE = {
  phases: [
    {
      phase: 'Language Test',
      baseOption: '3-6 months',
      expressOption: '2-4 months',
      timeSaved: '1-2 months',
    },
    {
      phase: 'Application',
      baseOption: '18-24 months',
      expressOption: '6-8 months',
      timeSaved: '12-16 months',
    },
  ],
  totalBase: '27-36 months',
  totalExpress: '16-20 months',
  totalTimeSaved: '11-16 months',
  baseAdvantages: ['More predictable', 'Lower cost'],
  expressAdvantages: ['Much faster', 'Federal pathway'],
};

describe('TimelineComparison', () => {
  it('renders the header in collapsed state', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    expect(screen.getByText('Timeline Comparison')).toBeInTheDocument();
  });

  it('shows total timeline summaries in header', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    expect(screen.getByText('27-36 months')).toBeInTheDocument();
    expect(screen.getByText('16-20 months')).toBeInTheDocument();
    expect(screen.getByText('11-16 months')).toBeInTheDocument();
  });

  it('does not show phase details when collapsed', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    expect(screen.queryByText('Language Test')).not.toBeInTheDocument();
  });

  it('shows phase details when expanded', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    const header = screen.getByText('Timeline Comparison').closest('button')!;
    fireEvent.click(header);

    expect(screen.getByText('Language Test')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
  });

  it('shows advantages when expanded', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    const header = screen.getByText('Timeline Comparison').closest('button')!;
    fireEvent.click(header);

    expect(screen.getByText('More predictable')).toBeInTheDocument();
    expect(screen.getByText('Much faster')).toBeInTheDocument();
  });

  it('collapses on second click', () => {
    render(<TimelineComparison timeline={TIMELINE} />);
    const header = screen.getByText('Timeline Comparison').closest('button')!;
    fireEvent.click(header);
    fireEvent.click(header);

    expect(screen.queryByText('Language Test')).not.toBeInTheDocument();
  });
});
