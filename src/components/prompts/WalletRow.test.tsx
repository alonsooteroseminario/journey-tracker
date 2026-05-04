import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletRow } from './WalletRow';
import type { PromptWallet } from '@/types';

const mockShowUndoToast = vi.fn();
const mockUpdateWallet = vi.fn();
const mockDeleteWallet = vi.fn();
const mockDuplicateWallet = vi.fn();
const mockRestoreWallet = vi.fn();

vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: mockShowUndoToast }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/store/slices/promptsSlice', () => ({
  useUpdateWalletMutation: () => [mockUpdateWallet, { isLoading: false }],
  useDeleteWalletMutation: () => [mockDeleteWallet, { isLoading: false }],
  useDuplicateWalletMutation: () => [mockDuplicateWallet, { isLoading: false }],
  useRestoreWalletMutation: () => [mockRestoreWallet, { isLoading: false }],
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const BASE_WALLET: PromptWallet = {
  id: 'w1',
  userId: 'u1',
  title: 'Coding Prompts',
  icon: '🧠',
  order: 0,
  groups: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WalletRow', () => {
  it('renders the wallet title', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Coding Prompts')).toBeInTheDocument();
  });

  it('renders the wallet icon', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('🧠')).toBeInTheDocument();
  });

  it('clicking the row calls onSelect', () => {
    const onSelect = vi.fn();
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Coding Prompts'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('applies active styling when isSelected', () => {
    const { container } = render(
      <WalletRow wallet={BASE_WALLET} isSelected={true} onSelect={vi.fn()} />
    );
    expect(container.firstChild).toHaveClass('bg-brand-light');
  });

  it('lock button calls updateWallet with cycled lock level', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Lock: none'));
    expect(mockUpdateWallet).toHaveBeenCalledWith({ id: 'w1', patch: { lockLevel: 'soft' } });
  });

  it('duplicate button calls duplicateWallet', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Duplicate wallet'));
    expect(mockDuplicateWallet).toHaveBeenCalledWith('w1');
  });

  it('delete button calls deleteWallet and shows undo toast', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Delete wallet'));
    expect(mockDeleteWallet).toHaveBeenCalledWith('w1');
    expect(mockShowUndoToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Wallet "Coding Prompts" deleted' })
    );
  });

  it('delete button is disabled when soft-locked', () => {
    const wallet = { ...BASE_WALLET, lockLevel: 'soft' as const };
    render(<WalletRow wallet={wallet} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByTitle('Locked')).toBeDisabled();
  });

  it('shows chunk count when wallet has chunks', () => {
    const wallet = {
      ...BASE_WALLET,
      groups: [
        {
          id: 'g1', walletId: 'w1', title: 'G', order: 0,
          chunks: [
            { id: 'c1', groupId: 'g1', title: 'C', content: 'x', order: 0, createdAt: '', updatedAt: '' },
            { id: 'c2', groupId: 'g1', title: 'D', content: 'y', order: 1, createdAt: '', updatedAt: '' },
          ],
          createdAt: '', updatedAt: '',
        },
      ],
    };
    render(<WalletRow wallet={wallet} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('2 chunks')).toBeInTheDocument();
  });

  it('drag handle is rendered', () => {
    render(<WalletRow wallet={BASE_WALLET} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument();
  });
});
