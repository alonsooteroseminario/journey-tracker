import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareGoalStatusModal } from './ShareGoalStatusModal';

const mockWindowOpen = vi.fn();
const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });
  // Mock fetch to return a PNG blob
  global.fetch = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(['fake-image'], { type: 'image/png' })),
  } as unknown as Response);
  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: { write: mockClipboardWrite },
    writable: true,
    configurable: true,
  });
  // Simulate desktop: canShare returns false
  Object.defineProperty(navigator, 'canShare', {
    value: () => false,
    writable: true,
    configurable: true,
  });
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

  it('Share on X fetches image, copies to clipboard, and opens twitter intent URL', async () => {
    render(<ShareGoalStatusModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X'));
    await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    ));
    expect(mockClipboardWrite).toHaveBeenCalled();
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
