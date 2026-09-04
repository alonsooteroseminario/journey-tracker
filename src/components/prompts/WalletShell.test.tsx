import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletShell } from './WalletShell';
import type { PromptWallet } from '@/types';

const mockCreateWallet = vi.fn();
const mockCreateGroup = vi.fn();
const mockCreateChunk = vi.fn();
const mockRefetch = vi.fn();
const mockUseListWalletsQuery = vi.fn(() => ({
  data: [] as PromptWallet[],
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
}));

vi.mock('@/store/slices/promptsSlice', () => ({
  useListWalletsQuery: (...args: unknown[]) => mockUseListWalletsQuery(...args),
  useCreateWalletMutation: () => [mockCreateWallet, { isLoading: false }],
  useCreateGroupMutation: () => [mockCreateGroup, { isLoading: false }],
  useCreateChunkMutation: () => [mockCreateChunk, { isLoading: false }],
}));

vi.mock('./WalletSidebar', () => ({
  WalletSidebar: ({
    wallets,
    selectedWalletId,
    onSelect,
  }: {
    wallets: PromptWallet[];
    selectedWalletId: string | null;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="wallet-sidebar">
      {wallets.map((w) => (
        <button
          key={w.id}
          onClick={() => onSelect(w.id)}
          data-selected={w.id === selectedWalletId}
        >
          {w.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./WalletDetail', () => ({
  WalletDetail: ({ wallet }: { wallet: PromptWallet }) => (
    <div data-testid="wallet-detail">{wallet.title}</div>
  ),
}));

vi.mock('./ComposeDrawer', () => ({
  ComposeDrawer: () => <div data-testid="compose-drawer" />,
}));

const TWO_WALLETS: PromptWallet[] = [
  { id: 'w1', userId: 'u1', title: 'Alpha', order: 0, groups: [], createdAt: '', updatedAt: '' },
  { id: 'w2', userId: 'u1', title: 'Beta', order: 1, groups: [], createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseListWalletsQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  });
  mockCreateWallet.mockResolvedValue({ data: { id: 'w-new' } });
  mockCreateGroup.mockResolvedValue({ data: { id: 'g-new' } });
  mockCreateChunk.mockResolvedValue({ data: { id: 'c-new' } });
});

describe('WalletShell', () => {
  it('shows loading spinner when isLoading', () => {
    mockUseListWalletsQuery.mockReturnValue({ data: [], isLoading: true, isError: false, refetch: mockRefetch });
    render(<WalletShell />);
    expect(screen.getByText('Loading wallets…')).toBeInTheDocument();
  });

  it('shows empty state with seed buttons when no wallets', () => {
    render(<WalletShell />);
    expect(screen.getByText('Create your first wallet')).toBeInTheDocument();
    expect(screen.getByText('Coding Prompts')).toBeInTheDocument();
    expect(screen.getByText('Email Templates')).toBeInTheDocument();
    expect(screen.getByText('Marketing Copy')).toBeInTheDocument();
  });

  it('clicking a seed button calls createWallet with title + icon + description', () => {
    render(<WalletShell />);
    fireEvent.click(screen.getByText('Coding Prompts'));
    expect(mockCreateWallet).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Coding Prompts', icon: '🧠' })
    );
  });

  it('shows an error state — not the empty state — when the query fails', () => {
    mockUseListWalletsQuery.mockReturnValue({
      data: [], isLoading: false, isError: true, refetch: mockRefetch,
    });
    render(<WalletShell />);
    expect(screen.getByText('Could not load your wallets')).toBeInTheDocument();
    // The regression this guards: falling through to the empty state would tell
    // an existing user their wallets are gone and invite a duplicate.
    expect(screen.queryByText('Create your first wallet')).toBeNull();
  });

  it('retries the query from the error state', () => {
    mockUseListWalletsQuery.mockReturnValue({
      data: [], isLoading: false, isError: true, refetch: mockRefetch,
    });
    render(<WalletShell />);
    fireEvent.click(screen.getByText('Try again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders sidebar, detail, and compose when wallets exist', () => {
    mockUseListWalletsQuery.mockReturnValue({ data: TWO_WALLETS, isLoading: false, isError: false, refetch: mockRefetch });
    render(<WalletShell />);
    // Both desktop + mobile panes render in happy-dom (no CSS breakpoints)
    expect(screen.getAllByTestId('wallet-sidebar').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('wallet-detail').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('compose-drawer').length).toBeGreaterThan(0);
  });

  it('auto-selects the first wallet on load', () => {
    mockUseListWalletsQuery.mockReturnValue({ data: TWO_WALLETS, isLoading: false, isError: false, refetch: mockRefetch });
    render(<WalletShell />);
    expect(screen.getAllByTestId('wallet-detail')[0]).toHaveTextContent('Alpha');
  });

  it('clicking a different wallet in sidebar updates detail pane', () => {
    mockUseListWalletsQuery.mockReturnValue({ data: TWO_WALLETS, isLoading: false, isError: false, refetch: mockRefetch });
    render(<WalletShell />);
    fireEvent.click(screen.getAllByText('Beta')[0]);
    expect(screen.getAllByTestId('wallet-detail')[0]).toHaveTextContent('Beta');
  });
});
