import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletSidebar } from './WalletSidebar';
import type { PromptWallet } from '@/types';

const mockCreateWallet = vi.fn();
const mockReorderWallets = vi.fn();

vi.mock('@/store/slices/promptsSlice', () => ({
  useCreateWalletMutation: () => [mockCreateWallet, { isLoading: false }],
  useReorderWalletsMutation: () => [mockReorderWallets, { isLoading: false }],
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

vi.mock('./WalletRow', () => ({
  WalletRow: ({ wallet, isSelected, onSelect }: { wallet: PromptWallet; isSelected: boolean; onSelect: () => void }) => (
    <div
      data-testid="wallet-row"
      data-selected={isSelected}
      onClick={onSelect}
    >
      {wallet.title}
    </div>
  ),
}));

const WALLETS: PromptWallet[] = [
  { id: 'w1', userId: 'u1', title: 'First Wallet', order: 0, groups: [], createdAt: '', updatedAt: '' },
  { id: 'w2', userId: 'u1', title: 'Second Wallet', order: 1, groups: [], createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateWallet.mockResolvedValue({ data: { id: 'w-new' } });
});

describe('WalletSidebar', () => {
  it('renders a WalletRow per wallet', () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={vi.fn()} />);
    expect(screen.getAllByTestId('wallet-row')).toHaveLength(2);
  });

  it('marks the selected wallet as selected', () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId="w1" onSelect={vi.fn()} />);
    const rows = screen.getAllByTestId('wallet-row');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    expect(rows[1]).toHaveAttribute('data-selected', 'false');
  });

  it('clicking a row calls onSelect with wallet id', () => {
    const onSelect = vi.fn();
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('First Wallet'));
    expect(onSelect).toHaveBeenCalledWith('w1');
  });

  it('shows empty state when no wallets', () => {
    render(<WalletSidebar wallets={[]} selectedWalletId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('No wallets yet')).toBeInTheDocument();
  });

  it('New Wallet button opens the add form', () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('New Wallet'));
    expect(screen.getByLabelText('New wallet name')).toBeInTheDocument();
  });

  it('submitting the add form calls createWallet', async () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('New Wallet'));
    fireEvent.change(screen.getByLabelText('New wallet name'), { target: { value: 'My New Wallet' } });
    fireEvent.click(screen.getByText('Add'));
    expect(mockCreateWallet).toHaveBeenCalledWith({ title: 'My New Wallet' });
  });

  it('Enter key in add form submits', async () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('New Wallet'));
    const input = screen.getByLabelText('New wallet name');
    fireEvent.change(input, { target: { value: 'Keyboard Wallet' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockCreateWallet).toHaveBeenCalledWith({ title: 'Keyboard Wallet' });
  });

  it('Cancel hides the add form', () => {
    render(<WalletSidebar wallets={WALLETS} selectedWalletId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('New Wallet'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText('New wallet name')).not.toBeInTheDocument();
  });
});
