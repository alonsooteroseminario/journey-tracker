import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComposeChunkRow } from './ComposeChunkRow';
import type { PromptChunk } from '@/types';

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

const CHUNK: PromptChunk = {
  id: 'c1',
  groupId: 'g1',
  title: 'My System Prompt',
  content: 'You are helpful.',
  order: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const defaultProps = {
  chunk: CHUNK,
  onRemove: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ComposeChunkRow', () => {
  it('renders the chunk title', () => {
    render(<ComposeChunkRow {...defaultProps} />);
    expect(screen.getByText('My System Prompt')).toBeInTheDocument();
  });

  it('remove button calls onRemove', () => {
    render(<ComposeChunkRow {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Remove from Compose'));
    expect(defaultProps.onRemove).toHaveBeenCalledOnce();
  });

  it('renders drag handle', () => {
    render(<ComposeChunkRow {...defaultProps} />);
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument();
  });

  it('has no checkbox', () => {
    render(<ComposeChunkRow {...defaultProps} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
