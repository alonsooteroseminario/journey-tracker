import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareStreakButton } from './ShareStreakButton';
import { StreakTier } from '@/types';

vi.mock('./ShareStreakModal', () => ({
  ShareStreakModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ShareStreakButton', () => {
  const defaultProps = {
    streakCount: 7,
    tier: 'silver' as StreakTier,
  };

  it('renders share button when streak > 0', () => {
    render(<ShareStreakButton {...defaultProps} />);
    expect(screen.getByTitle('Share your streak')).toBeTruthy();
  });

  it('does not render when streakCount is 0', () => {
    render(<ShareStreakButton {...defaultProps} streakCount={0} />);
    expect(screen.queryByTitle('Share your streak')).toBeNull();
  });

  it('opens modal on click', () => {
    render(<ShareStreakButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share your streak'));
    expect(screen.getByTestId('share-modal')).toBeTruthy();
  });

  it('closes modal when onClose is called', () => {
    render(<ShareStreakButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share your streak'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('share-modal')).toBeNull();
  });
});
