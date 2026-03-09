import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareStreakModal } from './ShareStreakModal';
import { StreakTier } from '@/types';

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
  streakCount: 7,
  tier: 'silver' as StreakTier,
  onClose: vi.fn(),
};

describe('ShareStreakModal', () => {
  it('renders the modal with preview image', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const img = screen.getByAltText('Streak share preview');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('showTier=true');
    expect(img.getAttribute('src')).toContain('showTagline=true');
    expect(img.getAttribute('src')).toContain('showAppName=true');
  });

  it('includes goalId in preview URL when provided', () => {
    render(<ShareStreakModal {...defaultProps} goalId="goal-123" goalTitle="Fitness" />);
    const img = screen.getByAltText('Streak share preview');
    expect(img.getAttribute('src')).toContain('goalId=goal-123');
  });

  it('toggle removes param from preview URL', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const tierToggle = screen.getByLabelText('Show tier badge');
    fireEvent.click(tierToggle);
    const img = screen.getByAltText('Streak share preview');
    expect(img.getAttribute('src')).toContain('showTier=false');
  });

  it('Share on X copies image to clipboard and shows paste guide', async () => {
    render(<ShareStreakModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X'));
    await waitFor(() => expect(mockClipboardWrite).toHaveBeenCalled());
    expect(screen.getByText('Image copied to clipboard!')).toBeTruthy();
    expect(screen.getByText('Open X and paste image →')).toBeTruthy();
  });

  it('Open X and paste image button opens twitter intent URL', async () => {
    render(<ShareStreakModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share on X'));
    await waitFor(() => screen.getByText('Open X and paste image →'));
    fireEvent.click(screen.getByText('Open X and paste image →'));
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank'
    );
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ShareStreakModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('download link has correct href', () => {
    render(<ShareStreakModal {...defaultProps} />);
    const downloadLink = screen.getByText('Download PNG').closest('a')!;
    expect(downloadLink.getAttribute('href')).toContain('/api/share/streak');
    expect(downloadLink.getAttribute('download')).toBe('streak.png');
  });

  it('shows goal title in modal header when provided', () => {
    render(<ShareStreakModal {...defaultProps} goalTitle="My Fitness Goal" />);
    expect(screen.getByText('My Fitness Goal')).toBeTruthy();
  });
});
