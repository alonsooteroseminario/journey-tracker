import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupCard } from './GroupCard';
import type { PromptGroup } from '@/types';

const mockDispatch = vi.fn();
const mockUseSelector = vi.fn(() => [] as unknown[]);
const mockUpdateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockDuplicateGroup = vi.fn();
const mockRestoreGroup = vi.fn();
const mockCreateChunk = vi.fn();
const mockUpdateChunk = vi.fn();
const mockDeleteChunk = vi.fn();
const mockDuplicateChunk = vi.fn();
const mockRestoreChunk = vi.fn();
const mockReorderChunks = vi.fn();
const mockShowUndoToast = vi.fn();

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (...args: unknown[]) => mockUseSelector(...args),
  };
});

vi.mock('@/store/slices/promptsSlice', () => ({
  useUpdateGroupMutation: () => [mockUpdateGroup, { isLoading: false }],
  useDeleteGroupMutation: () => [mockDeleteGroup, { isLoading: false }],
  useDuplicateGroupMutation: () => [mockDuplicateGroup, { isLoading: false }],
  useRestoreGroupMutation: () => [mockRestoreGroup, { isLoading: false }],
  useCreateChunkMutation: () => [mockCreateChunk, { isLoading: false }],
  useUpdateChunkMutation: () => [mockUpdateChunk, { isLoading: false }],
  useDeleteChunkMutation: () => [mockDeleteChunk, { isLoading: false }],
  useDuplicateChunkMutation: () => [mockDuplicateChunk, { isLoading: false }],
  useRestoreChunkMutation: () => [mockRestoreChunk, { isLoading: false }],
  useReorderChunksMutation: () => [mockReorderChunks, { isLoading: false }],
}));

vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: mockShowUndoToast }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: 'vertical',
  sortableKeyboardCoordinates: () => null,
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));

vi.mock('./ChunkRow', () => ({
  ChunkRow: ({ chunk }: { chunk: { title: string } }) => (
    <div data-testid="chunk-row">{chunk.title}</div>
  ),
}));

const BASE_GROUP: PromptGroup = {
  id: 'g1',
  walletId: 'w1',
  title: 'System Role',
  order: 0,
  chunks: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const GROUP_WITH_CHUNKS: PromptGroup = {
  ...BASE_GROUP,
  chunks: [
    { id: 'c1', groupId: 'g1', title: 'Chunk A', content: 'Content A', order: 0, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'c2', groupId: 'g1', title: 'Chunk B', content: 'Content B', order: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSelector.mockReturnValue([]);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('GroupCard', () => {
  it('renders the group title', () => {
    render(<GroupCard group={BASE_GROUP} />);
    expect(screen.getByText('System Role')).toBeInTheDocument();
  });

  it('renders chunk count', () => {
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    expect(screen.getByText('2 chunks')).toBeInTheDocument();
  });

  it('chunks are hidden before expand', () => {
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    expect(screen.queryByTestId('chunk-row')).not.toBeInTheDocument();
  });

  it('expand button reveals chunk rows', () => {
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Expand'));
    expect(screen.getAllByTestId('chunk-row')).toHaveLength(2);
  });

  it('collapse button hides chunk rows', () => {
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Expand'));
    fireEvent.click(screen.getByTitle('Collapse'));
    expect(screen.queryByTestId('chunk-row')).not.toBeInTheDocument();
  });

  it('compose button with empty compose dispatches replaceWithGroup', () => {
    mockUseSelector.mockReturnValue([]);
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Compose group'));
    expect(mockDispatch).toHaveBeenCalled();
    expect(screen.queryByText('Replace')).not.toBeInTheDocument();
  });

  it('compose button with non-empty compose shows Replace/Append/Cancel dialog', () => {
    mockUseSelector.mockReturnValue([{ chunkId: 'cx', sessionOrder: 0, included: true }]);
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Compose group'));
    expect(screen.getByText('Replace')).toBeInTheDocument();
    expect(screen.getByText('Append')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('clicking Replace in dialog dispatches replaceWithGroup and closes dialog', () => {
    mockUseSelector.mockReturnValue([{ chunkId: 'cx', sessionOrder: 0, included: true }]);
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Compose group'));
    fireEvent.click(screen.getByText('Replace'));
    expect(mockDispatch).toHaveBeenCalled();
    expect(screen.queryByText('Replace')).not.toBeInTheDocument();
  });

  it('clicking Append in dialog dispatches appendGroup and closes dialog', () => {
    mockUseSelector.mockReturnValue([{ chunkId: 'cx', sessionOrder: 0, included: true }]);
    render(<GroupCard group={GROUP_WITH_CHUNKS} />);
    fireEvent.click(screen.getByTitle('Compose group'));
    fireEvent.click(screen.getByText('Append'));
    expect(mockDispatch).toHaveBeenCalled();
    expect(screen.queryByText('Append')).not.toBeInTheDocument();
  });

  it('delete button calls deleteGroup and showUndoToast', () => {
    render(<GroupCard group={BASE_GROUP} />);
    fireEvent.click(screen.getByTitle('Delete group'));
    expect(mockDeleteGroup).toHaveBeenCalledWith('g1');
    expect(mockShowUndoToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Group "System Role" deleted' })
    );
  });

  it('duplicate button calls duplicateGroup', () => {
    render(<GroupCard group={BASE_GROUP} />);
    fireEvent.click(screen.getByTitle('Duplicate group'));
    expect(mockDuplicateGroup).toHaveBeenCalledWith('g1');
  });

  it('lock button calls updateGroup with cycled lock level', () => {
    render(<GroupCard group={BASE_GROUP} />);
    fireEvent.click(screen.getByTitle('Lock: none'));
    expect(mockUpdateGroup).toHaveBeenCalledWith({ id: 'g1', patch: { lockLevel: 'soft' } });
  });

  it('soft-locked group disables delete', () => {
    const group = { ...BASE_GROUP, lockLevel: 'soft' as const };
    render(<GroupCard group={group} />);
    expect(screen.getByTitle('Locked')).toBeDisabled();
  });

  it('add chunk form submits createChunk', () => {
    render(<GroupCard group={BASE_GROUP} />);
    fireEvent.click(screen.getByTitle('Expand'));
    fireEvent.click(screen.getByText('Add Chunk'));
    fireEvent.change(screen.getByPlaceholderText('Chunk title…'), { target: { value: 'New Chunk' } });
    fireEvent.click(screen.getByText('Add'));
    expect(mockCreateChunk).toHaveBeenCalledWith({ groupId: 'g1', title: 'New Chunk', content: '' });
  });
});
