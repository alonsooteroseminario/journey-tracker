import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MergedPreview } from './MergedPreview';

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('MergedPreview', () => {
  it('renders the text in the preview textarea', () => {
    render(<MergedPreview text="Hello world" onCopy={vi.fn()} />);
    const textarea = screen.getByLabelText('Merged prompt preview');
    expect(textarea).toHaveValue('Hello world');
  });

  it('Copy Merged button is disabled when text is empty', () => {
    render(<MergedPreview text="" onCopy={vi.fn()} />);
    expect(screen.getByLabelText('Copy merged prompt')).toBeDisabled();
  });

  it('Copy Merged button is enabled when text is non-empty', () => {
    render(<MergedPreview text="some text" onCopy={vi.fn()} />);
    expect(screen.getByLabelText('Copy merged prompt')).not.toBeDisabled();
  });

  it('clicking Copy Merged calls clipboard.writeText with the full text', async () => {
    const onCopy = vi.fn();
    render(<MergedPreview text="prompt content" onCopy={onCopy} />);
    fireEvent.click(screen.getByLabelText('Copy merged prompt'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('prompt content');
    await waitFor(() => expect(onCopy).toHaveBeenCalledOnce());
  });

  it('shows token count for non-empty text', () => {
    // 4 chars → ceil(4/4) = 1 token
    render(<MergedPreview text="abcd" onCopy={vi.fn()} />);
    expect(screen.getByLabelText('Token count')).toHaveTextContent('≈ 1 tokens');
  });

  it('does not show token count when empty', () => {
    render(<MergedPreview text="" onCopy={vi.fn()} />);
    expect(screen.queryByLabelText('Token count')).not.toBeInTheDocument();
  });

  it('token count rounds up correctly', () => {
    // 5 chars → ceil(5/4) = 2 tokens
    render(<MergedPreview text="abcde" onCopy={vi.fn()} />);
    expect(screen.getByLabelText('Token count')).toHaveTextContent('≈ 2 tokens');
  });
});
