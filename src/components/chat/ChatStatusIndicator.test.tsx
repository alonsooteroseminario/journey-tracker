import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { ProcessingEvent } from '@/hooks/useChat';

describe('ChatStatusIndicator', () => {
  describe('Idle state', () => {
    it('should render nothing when status is idle', () => {
      const { container } = render(<ChatStatusIndicator status="idle" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Status text', () => {
    it('should show "Thinking..." when status is thinking', () => {
      render(<ChatStatusIndicator status="thinking" />);
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('should show "Running <name>..." when using_tool with toolName', () => {
      render(<ChatStatusIndicator status="using_tool" toolName="get-goals" />);
      expect(screen.getByText('Running get-goals...')).toBeInTheDocument();
    });

    it('should show "Running tool..." when using_tool without toolName', () => {
      render(<ChatStatusIndicator status="using_tool" />);
      expect(screen.getByText('Running tool...')).toBeInTheDocument();
    });

    it('should show "Generating response..." when generating', () => {
      render(<ChatStatusIndicator status="generating" />);
      expect(screen.getByText('Generating response...')).toBeInTheDocument();
    });
  });

  describe('Processing log — pending', () => {
    it('should show ⟳ icon for tools that have not yet completed', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'get-goals', inputSummary: 'limit: 10', resultSummary: null, success: null },
      ];
      render(<ChatStatusIndicator status="using_tool" toolName="get-goals" processingLog={log} />);

      expect(screen.getByText('⟳')).toBeInTheDocument();
      expect(screen.getByText('get-goals')).toBeInTheDocument();
      expect(screen.getByText('{limit: 10}')).toBeInTheDocument();
    });

    it('should not render result summary when null', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'create-task', inputSummary: 'title: x', resultSummary: null, success: null },
      ];
      render(<ChatStatusIndicator status="using_tool" toolName="create-task" processingLog={log} />);

      expect(screen.queryByText(/→/)).toBeNull();
    });
  });

  describe('Processing log — success', () => {
    it('should show ✓ icon and result summary for successful tools', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'get-goals', inputSummary: '', resultSummary: 'Found 3 goals', success: true },
      ];
      render(<ChatStatusIndicator status="thinking" processingLog={log} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('→ Found 3 goals')).toBeInTheDocument();
    });

    it('should not render input summary when empty string', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'get-goals', inputSummary: '', resultSummary: 'OK', success: true },
      ];
      const { container } = render(<ChatStatusIndicator status="thinking" processingLog={log} />);

      // No element should contain the pattern "{}" alone
      const spans = container.querySelectorAll('span');
      const inputSpans = Array.from(spans).filter((s) => s.textContent === '{}');
      expect(inputSpans).toHaveLength(0);
    });
  });

  describe('Processing log — failure', () => {
    it('should show ✗ icon and error summary for failed tools', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'delete-goal', inputSummary: 'goalId: abc', resultSummary: 'Error: not found', success: false },
      ];
      render(<ChatStatusIndicator status="thinking" processingLog={log} />);

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText('→ Error: not found')).toBeInTheDocument();
    });
  });

  describe('Multiple events', () => {
    it('should render all events in order', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'get-goals', inputSummary: '', resultSummary: 'Found 2', success: true },
        { toolName: 'create-task', inputSummary: 'title: Do X', resultSummary: null, success: null },
        { toolName: 'update-goal', inputSummary: 'goalId: g1', resultSummary: 'Updated', success: true },
      ];
      render(<ChatStatusIndicator status="using_tool" toolName="create-task" processingLog={log} />);

      expect(screen.getByText('get-goals')).toBeInTheDocument();
      expect(screen.getByText('create-task')).toBeInTheDocument();
      expect(screen.getByText('update-goal')).toBeInTheDocument();
    });

    it('should show mixed status icons', () => {
      const log: ProcessingEvent[] = [
        { toolName: 'tool-a', inputSummary: '', resultSummary: 'OK', success: true },
        { toolName: 'tool-b', inputSummary: '', resultSummary: null, success: null },
        { toolName: 'tool-c', inputSummary: '', resultSummary: 'Failed', success: false },
      ];
      render(<ChatStatusIndicator status="thinking" processingLog={log} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('⟳')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });

  describe('Empty log', () => {
    it('should not render the log section when processingLog is empty', () => {
      const { container } = render(<ChatStatusIndicator status="thinking" processingLog={[]} />);

      // The log wrapper div (with space-y-0.5) should not exist
      expect(container.querySelector('.space-y-0\\.5')).toBeNull();
    });
  });
});
