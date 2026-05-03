import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UndoToastProvider, useUndoToast } from './UndoToastProvider';

// Helper: a button that triggers showUndoToast with configurable args
function ToastTrigger({
  message = 'Item deleted',
  onUndo = vi.fn(),
  durationMs,
}: {
  message?: string;
  onUndo?: () => void;
  durationMs?: number;
}) {
  const { showUndoToast } = useUndoToast();
  return (
    <button
      onClick={() => showUndoToast({ message, onUndo, durationMs })}
    >
      trigger
    </button>
  );
}

describe('UndoToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when no toast is active', () => {
    render(
      <UndoToastProvider>
        <div>content</div>
      </UndoToastProvider>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows toast with message after showUndoToast is called', () => {
    render(
      <UndoToastProvider>
        <ToastTrigger message="Task deleted" onUndo={vi.fn()} />
      </UndoToastProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Task deleted')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls onUndo and dismisses toast when Undo is clicked', () => {
    const onUndo = vi.fn();
    render(
      <UndoToastProvider>
        <ToastTrigger onUndo={onUndo} />
      </UndoToastProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    fireEvent.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('auto-dismisses after durationMs without calling onUndo', () => {
    const onUndo = vi.fn();
    render(
      <UndoToastProvider>
        <ToastTrigger onUndo={onUndo} durationMs={3000} />
      </UndoToastProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('hovering pauses the timer so toast outlasts its normal duration', () => {
    const onUndo = vi.fn();
    render(
      <UndoToastProvider>
        <ToastTrigger onUndo={onUndo} durationMs={3000} />
      </UndoToastProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    const alert = screen.getByRole('alert');

    // Advance half the duration, then hover
    act(() => { vi.advanceTimersByTime(1500); });
    fireEvent.mouseEnter(alert);

    // Advance well past original end — still showing because timer is paused
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Mouse leave — timer resumes with ~1500ms remaining
    fireEvent.mouseLeave(alert);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('replaces active toast without calling previous onUndo', () => {
    const onUndo1 = vi.fn();
    const onUndo2 = vi.fn();

    function TwoTriggers() {
      const { showUndoToast } = useUndoToast();
      return (
        <>
          <button onClick={() => showUndoToast({ message: 'First', onUndo: onUndo1 })}>
            first
          </button>
          <button onClick={() => showUndoToast({ message: 'Second', onUndo: onUndo2 })}>
            second
          </button>
        </>
      );
    }

    render(
      <UndoToastProvider>
        <TwoTriggers />
      </UndoToastProvider>
    );

    fireEvent.click(screen.getByText('first'));
    expect(screen.getByText('First')).toBeInTheDocument();

    fireEvent.click(screen.getByText('second'));
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(onUndo1).not.toHaveBeenCalled();
  });

  it('dismisses without calling onUndo when Esc is pressed', () => {
    const onUndo = vi.fn();
    render(
      <UndoToastProvider>
        <ToastTrigger onUndo={onUndo} />
      </UndoToastProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('useUndoToast throws when used outside UndoToastProvider', () => {
    function BadConsumer() {
      useUndoToast();
      return null;
    }
    expect(() => render(<BadConsumer />)).toThrow(
      'useUndoToast must be used within UndoToastProvider'
    );
  });
});
