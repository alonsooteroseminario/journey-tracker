import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import { Message } from '@/types/agent';

describe('ChatMessage', () => {
  const baseMessage: Omit<Message, 'role'> = {
    id: 'msg-1',
    content: 'Hello',
    timestamp: new Date('2024-06-15T14:30:00Z'),
  };

  describe('User messages', () => {
    it('should render right-aligned with blue background', () => {
      const message: Message = { ...baseMessage, role: 'user', content: 'Hi there' };
      const { container } = render(<ChatMessage message={message} />);

      expect(screen.getByText('Hi there')).toBeInTheDocument();
      const wrapper = container.firstElementChild;
      expect(wrapper).toHaveClass('justify-end');
      expect(wrapper?.firstElementChild).toHaveClass('bg-brand-primary', 'text-white');
    });
  });

  describe('Assistant messages', () => {
    it('should render left-aligned with gray background', () => {
      const message: Message = { ...baseMessage, role: 'assistant', content: 'How can I help?' };
      const { container } = render(<ChatMessage message={message} />);

      expect(screen.getByText('How can I help?')).toBeInTheDocument();
      const wrapper = container.firstElementChild;
      expect(wrapper).toHaveClass('justify-start');
      expect(wrapper?.firstElementChild).toHaveClass('bg-gray-200');
    });

    it('should show toolUsed badge when present', () => {
      const message: Message = {
        ...baseMessage,
        role: 'assistant',
        content: 'Done!',
        toolUsed: 'create-goal',
      };
      render(<ChatMessage message={message} />);

      expect(screen.getByText(/create-goal/)).toBeInTheDocument();
    });

    it('should not render toolUsed badge when absent', () => {
      const message: Message = { ...baseMessage, role: 'assistant', content: 'Hello' };
      render(<ChatMessage message={message} />);

      expect(screen.queryByText(/Tool:/)).not.toBeInTheDocument();
    });

    it('should render timestamp', () => {
      const message: Message = { ...baseMessage, role: 'assistant', content: 'Hi' };
      const { container } = render(<ChatMessage message={message} />);

      // Timestamp div is the last child of the bubble; just verify it exists
      const bubble = container.querySelector('.bg-gray-200');
      const timestampDiv = bubble?.lastElementChild;
      expect(timestampDiv).toBeTruthy();
      expect(timestampDiv?.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('System messages', () => {
    it('should render as a compact tool-log container', () => {
      const message: Message = {
        ...baseMessage,
        role: 'system',
        content: '✓ get-goals {limit: 10} → Found 3 goals\n✓ create-task {title: Foo} → OK',
      };
      render(<ChatMessage message={message} />);

      expect(screen.getByText('🔧 Tools executed')).toBeInTheDocument();
      expect(screen.getByText(/get-goals/)).toBeInTheDocument();
      expect(screen.getByText(/create-task/)).toBeInTheDocument();
    });

    it('should not render as a chat bubble', () => {
      const message: Message = { ...baseMessage, role: 'system', content: 'tool log here' };
      const { container } = render(<ChatMessage message={message} />);

      // System messages do not use the bubble layout classes
      expect(container.querySelector('.justify-end')).toBeNull();
      expect(container.querySelector('.justify-start')).toBeNull();
    });

    it('should use monospace font for tool output', () => {
      const message: Message = { ...baseMessage, role: 'system', content: 'log' };
      const { container } = render(<ChatMessage message={message} />);

      const logDiv = container.querySelector('.font-mono');
      expect(logDiv).toBeTruthy();
      expect(logDiv?.textContent).toBe('log');
    });
  });
});
