import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareGoalStatusButton } from './ShareGoalStatusButton';

vi.mock('./ShareGoalStatusModal', () => ({
  ShareGoalStatusModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="goal-status-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ShareGoalStatusButton', () => {
  const defaultProps = {
    goalId: 'goal-1',
    goalTitle: 'Learn Spanish',
    goalIcon: '📚',
    progress: 67,
  };

  it('renders share button when progress > 0', () => {
    render(<ShareGoalStatusButton {...defaultProps} />);
    expect(screen.getByTitle('Share goal status')).toBeTruthy();
  });

  it('does not render when progress is 0', () => {
    render(<ShareGoalStatusButton {...defaultProps} progress={0} />);
    expect(screen.queryByTitle('Share goal status')).toBeNull();
  });

  it('does not render when progress is negative', () => {
    render(<ShareGoalStatusButton {...defaultProps} progress={-1} />);
    expect(screen.queryByTitle('Share goal status')).toBeNull();
  });

  it('opens modal on click', () => {
    render(<ShareGoalStatusButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share goal status'));
    expect(screen.getByTestId('goal-status-modal')).toBeTruthy();
  });

  it('closes modal when onClose called', () => {
    render(<ShareGoalStatusButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share goal status'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('goal-status-modal')).toBeNull();
  });
});
