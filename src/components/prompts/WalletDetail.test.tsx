import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletDetail } from './WalletDetail';
import type { PromptWallet } from '@/types';

const mockCreateGroup = vi.fn();
const mockReorderGroups = vi.fn();

vi.mock('@/store/slices/promptsSlice', () => ({
  useCreateGroupMutation: () => [mockCreateGroup, { isLoading: false }],
  useReorderGroupsMutation: () => [mockReorderGroups, { isLoading: false }],
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

vi.mock('./WalletHeader', () => ({
  WalletHeader: ({ wallet }: { wallet: { title: string } }) => (
    <div data-testid="wallet-header">{wallet.title}</div>
  ),
}));

vi.mock('./GroupCard', () => ({
  GroupCard: ({ group }: { group: { title: string } }) => (
    <div data-testid="group-card">{group.title}</div>
  ),
}));

const BASE_WALLET: PromptWallet = {
  id: 'w1',
  userId: 'u1',
  title: 'My Wallet',
  order: 0,
  groups: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const WALLET_WITH_GROUPS: PromptWallet = {
  ...BASE_WALLET,
  groups: [
    { id: 'g1', walletId: 'w1', title: 'Group One', order: 0, chunks: [], createdAt: '', updatedAt: '' },
    { id: 'g2', walletId: 'w1', title: 'Group Two', order: 1, chunks: [], createdAt: '', updatedAt: '' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WalletDetail', () => {
  it('renders WalletHeader with wallet', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    expect(screen.getByTestId('wallet-header')).toHaveTextContent('My Wallet');
  });

  it('renders a GroupCard per group', () => {
    render(<WalletDetail wallet={WALLET_WITH_GROUPS} />);
    expect(screen.getAllByTestId('group-card')).toHaveLength(2);
    expect(screen.getByText('Group One')).toBeInTheDocument();
    expect(screen.getByText('Group Two')).toBeInTheDocument();
  });

  it('shows empty state when no groups', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    expect(screen.getByText('Create a group to start adding prompts.')).toBeInTheDocument();
  });

  it('Add Group button opens the inline form', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('Add Group'));
    expect(screen.getByLabelText('New group name')).toBeInTheDocument();
  });

  it('submitting add group form calls createGroup', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('Add Group'));
    fireEvent.change(screen.getByLabelText('New group name'), { target: { value: 'New Group' } });
    fireEvent.click(screen.getByText('Add'));
    expect(mockCreateGroup).toHaveBeenCalledWith({ walletId: 'w1', title: 'New Group' });
  });

  it('cancelling add group form hides form', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('Add Group'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText('New group name')).not.toBeInTheDocument();
  });

  it('Enter key in new group input submits form', () => {
    render(<WalletDetail wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('Add Group'));
    const input = screen.getByLabelText('New group name');
    fireEvent.change(input, { target: { value: 'Keyboard Group' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockCreateGroup).toHaveBeenCalledWith({ walletId: 'w1', title: 'Keyboard Group' });
  });
});
