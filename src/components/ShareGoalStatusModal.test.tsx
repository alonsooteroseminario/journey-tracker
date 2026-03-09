import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareGoalStatusModal } from './ShareGoalStatusModal';

const mockWindowOpen = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
});

const defaultProps = {
  goalId: 'goal-1',
  goalTitle: 'Learn Spanish',
  goalIcon: '📚',
  progress: 67,
  onClose: vi.fn(),
};

describe('ShareGoalStatusModal', () => {
  it('renders modal with preview image', () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    const img = screen.getByAltText('Goal status share preview');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('goalId=goal-1');
    expect(img.getAttribute('src')).toContain('showProgress=true');
  });

  it('shows goal title in header', () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    expect(screen.getByText('Learn Spanish')).toBeTruthy();
  });

  it('toggle updates preview URL', () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    const progressToggle = screen.getByLabelText('Show progress');
    fireEvent.click(progressToggle);
    const img = screen.getByAltText('Goal status share preview');
    expect(img.getAttribute('src')).toContain('showProgress=false');
  });

  it('Share on X opens twitter intent URL', () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X'));
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    );
  });

  it('download link has correct href and download attribute', () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    const link = screen.getByText('Download PNG').closest('a')!;
    expect(link.getAttribute('href')).toContain('/api/share/goal');
    expect(link.getAttribute('download')).toBe('goal-status.png');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ShareGoalStatusModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
