import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetSummary } from './BudgetSummary';

const BUDGET = {
  items: [
    { phase: 'Application', item: 'IRCC fee', cost: '$825', timing: 'Month 1', notes: 'Required' },
    { phase: 'Application', item: 'Biometrics', cost: '$85', timing: 'Month 1', notes: 'First-time' },
    { phase: 'Settlement', item: 'Flight', cost: '$800', timing: 'Month 6', notes: 'One-way' },
  ],
  totalBase: '$4,200',
  totalExpressEntry: '$3,800',
  difference: '$400',
  timeSaved: '11 months faster',
};

describe('BudgetSummary', () => {
  it('renders the budget header in collapsed state', () => {
    render(<BudgetSummary budget={BUDGET} />);
    expect(screen.getByText('Budget Summary')).toBeInTheDocument();
    expect(screen.getByText('Complete cost breakdown')).toBeInTheDocument();
  });

  it('shows total costs in the header', () => {
    render(<BudgetSummary budget={BUDGET} />);
    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText('$3,800')).toBeInTheDocument();
    expect(screen.getByText('11 months faster')).toBeInTheDocument();
  });

  it('does not show item details when collapsed', () => {
    render(<BudgetSummary budget={BUDGET} />);
    // Detailed breakdown not shown
    expect(screen.queryByText('IRCC fee')).not.toBeInTheDocument();
  });

  it('shows item details when expanded', () => {
    render(<BudgetSummary budget={BUDGET} />);
    const header = screen.getByText('Budget Summary').closest('button')!;
    fireEvent.click(header);

    expect(screen.getByText('IRCC fee')).toBeInTheDocument();
    expect(screen.getByText('Biometrics')).toBeInTheDocument();
    expect(screen.getByText('Flight')).toBeInTheDocument();
  });

  it('groups items by phase when expanded', () => {
    render(<BudgetSummary budget={BUDGET} />);
    const header = screen.getByText('Budget Summary').closest('button')!;
    fireEvent.click(header);

    // Both phases show their headings
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByText('Settlement')).toBeInTheDocument();
  });

  it('collapses again on second click', () => {
    render(<BudgetSummary budget={BUDGET} />);
    const header = screen.getByText('Budget Summary').closest('button')!;
    fireEvent.click(header); // expand
    fireEvent.click(header); // collapse

    expect(screen.queryByText('IRCC fee')).not.toBeInTheDocument();
  });
});
