import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComposeDrawer } from './ComposeDrawer';
import type { ComposeChunkRef } from '@/store/slices/composeSlice';

const mockDispatch = vi.fn();
const mockUseSelector = vi.fn(() => [] as ComposeChunkRef[]);

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (...args: unknown[]) => mockUseSelector(...args),
  };
});

vi.mock('@/store/slices/promptsSlice', () => ({
  useListWalletsQuery: () => ({
    data: [
      {
        id: 'w1',
        userId: 'u1',
        title: 'W',
        order: 0,
        groups: [
          {
            id: 'g1',
            walletId: 'w1',
            title: 'G',
            order: 0,
            chunks: [
              { id: 'c1', groupId: 'g1', title: 'Chunk Alpha', content: 'alpha content', order: 0, createdAt: '', updatedAt: '' },
              { id: 'c2', groupId: 'g1', title: 'Chunk Beta', content: 'beta content', order: 1, createdAt: '', updatedAt: '' },
            ],
          },
        ],
      },
    ],
  }),
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

vi.mock('./ComposeChunkRow', () => ({
  ComposeChunkRow: ({ chunk, onRemove }: { chunk: { title: string }; onRemove: () => void }) => (
    <div data-testid="compose-row">
      {chunk.title}
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}));

vi.mock('./MergedPreview', () => ({
  MergedPreview: ({ text }: { text: string }) => (
    <div data-testid="merged-preview">{text}</div>
  ),
}));

const TWO_REFS: ComposeChunkRef[] = [
  { chunkId: 'c1', sessionOrder: 0, included: true },
  { chunkId: 'c2', sessionOrder: 1, included: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSelector.mockReturnValue([]);
});

describe('ComposeDrawer', () => {
  it('shows empty state when no refs', () => {
    render(<ComposeDrawer />);
    expect(screen.getByText('Add chunks here to build your final prompt.')).toBeInTheDocument();
  });

  it('shows chunk rows when refs exist', () => {
    mockUseSelector.mockReturnValue(TWO_REFS);
    render(<ComposeDrawer />);
    expect(screen.getAllByTestId('compose-row')).toHaveLength(2);
    expect(screen.getByText('Chunk Alpha')).toBeInTheDocument();
    expect(screen.getByText('Chunk Beta')).toBeInTheDocument();
  });

  it('shows count in header when refs exist', () => {
    mockUseSelector.mockReturnValue(TWO_REFS);
    render(<ComposeDrawer />);
    expect(screen.getByText('Compose (2)')).toBeInTheDocument();
  });

  it('clear button dispatches clearCompose', () => {
    mockUseSelector.mockReturnValue(TWO_REFS);
    render(<ComposeDrawer />);
    fireEvent.click(screen.getByLabelText('Clear compose'));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('remove dispatches removeChunk', () => {
    mockUseSelector.mockReturnValue(TWO_REFS);
    render(<ComposeDrawer />);
    fireEvent.click(screen.getAllByText('Remove')[0]);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('passes merged text of all composed chunks to MergedPreview', () => {
    mockUseSelector.mockReturnValue(TWO_REFS);
    render(<ComposeDrawer />);
    // All chunks contribute — both alpha and beta content appear
    expect(screen.getByTestId('merged-preview')).toHaveTextContent('alpha content');
    expect(screen.getByTestId('merged-preview')).toHaveTextContent('beta content');
  });

  it('does not show Clear button when compose is empty', () => {
    mockUseSelector.mockReturnValue([]);
    render(<ComposeDrawer />);
    expect(screen.queryByLabelText('Clear compose')).not.toBeInTheDocument();
  });
});
