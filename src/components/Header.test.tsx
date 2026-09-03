import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { AccessProvider } from './AccessProvider';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { fullName: 'Test User', firstName: 'Test', imageUrl: null },
    isLoaded: true,
  }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockSelector = vi.fn();

vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
    mockSelector(selector),
}));

describe('Header', () => {
  it('renders chat toggle button with "Open chat" label when chat is closed', () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: false } })
    );
    render(<Header />);
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
  });

  it('renders chat toggle button with "Close chat" label when chat is open', () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: true } })
    );
    render(<Header />);
    expect(screen.getByLabelText('Close chat')).toBeTruthy();
  });
});

describe('Header — free (wallet-only) user', () => {
  const renderFree = () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: false } })
    );
    return render(
      <AccessProvider value={false}>
        <Header />
      </AccessProvider>
    );
  };

  it('shows "Prompt Wallet" as the title', () => {
    renderFree();
    expect(screen.getByText('Prompt Wallet')).toBeTruthy();
  });

  it('does not show the Cadence wordmark', () => {
    renderFree();
    expect(screen.queryByText('Cadence')).toBeNull();
  });

  it('hides the nav tab bar', () => {
    renderFree();
    expect(screen.queryByText('Board')).toBeNull();
    expect(screen.queryByText('Feed')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('hides the chat toggle', () => {
    renderFree();
    expect(screen.queryByLabelText('Open chat')).toBeNull();
  });

  it('hides the Friends button', () => {
    renderFree();
    expect(screen.queryByText('Friends')).toBeNull();
  });

  it('points the logo at /wallet', () => {
    const { container } = renderFree();
    const logo = container.querySelector('a[href="/wallet"]');
    expect(logo).toBeTruthy();
  });

  it('keeps the profile link and logout', () => {
    const { container } = renderFree();
    expect(container.querySelector('a[href="/profile"]')).toBeTruthy();
    expect(screen.getByLabelText('Log out')).toBeTruthy();
  });
});

describe('Header — full-access user', () => {
  it('still renders the Cadence wordmark and tab bar by default', () => {
    mockSelector.mockImplementation(
      (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
        selector({ chat: { isOpen: false } })
    );
    render(<Header />);
    expect(screen.getByText('Board')).toBeTruthy();
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
  });
});
