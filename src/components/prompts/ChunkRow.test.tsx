import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChunkRow } from './ChunkRow';
import type { PromptChunk } from '@/types';

const mockShowUndoToast = vi.fn();

vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: mockShowUndoToast }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const BASE_CHUNK: PromptChunk = {
  id: 'c1',
  groupId: 'g1',
  title: 'System Role',
  content: 'You are a helpful assistant.',
  order: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const defaultProps = {
  chunk: BASE_CHUNK,
  isInCompose: false,
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onUpdateLock: vi.fn(),
  onRestore: vi.fn(),
  onAddToCompose: vi.fn(),
  onRemoveFromCompose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('ChunkRow', () => {
  it('renders the chunk title', () => {
    render(<ChunkRow {...defaultProps} />);
    expect(screen.getByText('System Role')).toBeInTheDocument();
  });

  it('renders drag handle button', () => {
    render(<ChunkRow {...defaultProps} />);
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument();
  });

  it('copy button calls clipboard.writeText with chunk.title', async () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Copy title'));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('System Role')
    );
  });

  it('Add to Compose button calls onAddToCompose when not in compose', () => {
    render(<ChunkRow {...defaultProps} isInCompose={false} />);
    fireEvent.click(screen.getByTitle('Add to Compose'));
    expect(defaultProps.onAddToCompose).toHaveBeenCalledOnce();
    expect(defaultProps.onRemoveFromCompose).not.toHaveBeenCalled();
  });

  it('Remove from Compose button calls onRemoveFromCompose when in compose', () => {
    render(<ChunkRow {...defaultProps} isInCompose={true} />);
    fireEvent.click(screen.getByTitle('Remove from Compose'));
    expect(defaultProps.onRemoveFromCompose).toHaveBeenCalledOnce();
    expect(defaultProps.onAddToCompose).not.toHaveBeenCalled();
  });

  it('clicking Edit shows edit mode with title input and content textarea', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByPlaceholderText('Chunk title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Prompt content…')).toBeInTheDocument();
  });

  it('Save in edit mode calls onUpdate with trimmed title and content', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    const titleInput = screen.getByPlaceholderText('Chunk title');
    fireEvent.change(titleInput, { target: { value: '  Updated Title  ' } });
    fireEvent.click(screen.getByText('Save'));
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      title: 'Updated Title',
      content: 'You are a helpful assistant.',
    });
  });

  it('Cancel in edit mode resets without calling onUpdate', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.change(screen.getByPlaceholderText('Chunk title'), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('System Role')).toBeInTheDocument();
  });

  it('Delete calls onDelete and showUndoToast when unlocked', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Delete'));
    expect(defaultProps.onDelete).toHaveBeenCalledOnce();
    expect(mockShowUndoToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Chunk "System Role" deleted' })
    );
  });

  it('Delete button is disabled when soft locked', () => {
    const chunk = { ...BASE_CHUNK, lockLevel: 'soft' as const };
    render(<ChunkRow {...defaultProps} chunk={chunk} />);
    const deleteBtn = screen.getByTitle('Locked');
    expect(deleteBtn).toBeDisabled();
  });

  it('Edit button is disabled when hard locked', () => {
    const chunk = { ...BASE_CHUNK, lockLevel: 'hard' as const };
    render(<ChunkRow {...defaultProps} chunk={chunk} />);
    const buttons = screen.getAllByTitle('Locked');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it('Lock button calls onUpdateLock with cycled lock level', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Lock: none'));
    expect(defaultProps.onUpdateLock).toHaveBeenCalledWith('soft');
  });

  it('Duplicate button calls onDuplicate', () => {
    render(<ChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Duplicate'));
    expect(defaultProps.onDuplicate).toHaveBeenCalledOnce();
  });

  it('soft-locked chunk shows lock badge', () => {
    const chunk = { ...BASE_CHUNK, lockLevel: 'soft' as const };
    render(<ChunkRow {...defaultProps} chunk={chunk} />);
    expect(screen.getByLabelText('Soft locked')).toBeInTheDocument();
  });

  it('hard-locked chunk shows hard lock badge', () => {
    const chunk = { ...BASE_CHUNK, lockLevel: 'hard' as const };
    render(<ChunkRow {...defaultProps} chunk={chunk} />);
    expect(screen.getByLabelText('Hard locked')).toBeInTheDocument();
  });
});
