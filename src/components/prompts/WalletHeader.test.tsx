import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletHeader } from './WalletHeader';
import type { PromptWallet } from '@/types';

const mockUpdateWallet = vi.fn();

vi.mock('@/store/slices/promptsSlice', () => ({
  useUpdateWalletMutation: () => [mockUpdateWallet, { isLoading: false }],
}));

const BASE_WALLET: PromptWallet = {
  id: 'w1',
  userId: 'u1',
  title: 'My Wallet',
  icon: '🧠',
  description: 'A great wallet',
  order: 0,
  groups: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WalletHeader', () => {
  it('renders the wallet title', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    expect(screen.getByText('My Wallet')).toBeInTheDocument();
  });

  it('renders the wallet description', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    expect(screen.getByDisplayValue('A great wallet')).toBeInTheDocument();
  });

  it('renders the wallet icon', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    expect(screen.getByDisplayValue('🧠')).toBeInTheDocument();
  });

  it('clicking title enters edit mode', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('My Wallet'));
    expect(screen.getByLabelText('Wallet title')).toBeInTheDocument();
  });

  it('blurring title input with changed value calls updateWallet', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('My Wallet'));
    const input = screen.getByLabelText('Wallet title');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.blur(input);
    expect(mockUpdateWallet).toHaveBeenCalledWith({ id: 'w1', patch: { title: 'New Name' } });
  });

  it('blurring title with same value does not call updateWallet', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    fireEvent.click(screen.getByText('My Wallet'));
    const input = screen.getByLabelText('Wallet title');
    fireEvent.blur(input);
    expect(mockUpdateWallet).not.toHaveBeenCalled();
  });

  it('blurring description with changed value calls updateWallet', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    const desc = screen.getByLabelText('Wallet description');
    fireEvent.change(desc, { target: { value: 'New description' } });
    fireEvent.blur(desc);
    expect(mockUpdateWallet).toHaveBeenCalledWith({ id: 'w1', patch: { description: 'New description' } });
  });

  it('blurring icon with changed value calls updateWallet', () => {
    render(<WalletHeader wallet={BASE_WALLET} />);
    const icon = screen.getByLabelText('Wallet icon');
    fireEvent.change(icon, { target: { value: '🚀' } });
    fireEvent.blur(icon);
    expect(mockUpdateWallet).toHaveBeenCalledWith({ id: 'w1', patch: { icon: '🚀' } });
  });
});
