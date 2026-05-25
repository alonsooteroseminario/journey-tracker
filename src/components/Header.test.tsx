import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

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
