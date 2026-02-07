import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea with placeholder', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      expect(screen.getByPlaceholderText('Ask me anything about your goals...')).toBeInTheDocument();
    });

    it('should render Send button', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('should show keyboard hint text', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });
  });

  describe('Sending messages', () => {
    it('should call onSend when Enter is pressed with non-empty input', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should call onSend when Send button is clicked', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByText('Send'));

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should trim whitespace before sending', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.change(textarea, { target: { value: '  spaces  ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledWith('spaces');
    });

    it('should clear input after sending', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(textarea.value).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should not send on Shift+Enter', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send when input is only whitespace', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('should disable textarea when disabled', () => {
      render(<ChatInput onSend={mockOnSend} disabled={true} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      expect(textarea).toBeDisabled();
    });

    it('should disable Send button when disabled', () => {
      render(<ChatInput onSend={mockOnSend} disabled={true} />);
      const sendButton = screen.getByText('Send');

      expect(sendButton).toBeDisabled();
    });

    it('should not call onSend when disabled even with input', () => {
      render(<ChatInput onSend={mockOnSend} disabled={true} />);
      const textarea = screen.getByPlaceholderText('Ask me anything about your goals...');

      // Programmatically set value (disabled inputs can't be changed via user events)
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should disable Send button when input is empty (regardless of disabled prop)', () => {
      render(<ChatInput onSend={mockOnSend} disabled={false} />);
      const sendButton = screen.getByText('Send');

      // No text typed — button should be disabled
      expect(sendButton).toBeDisabled();
    });
  });
});
