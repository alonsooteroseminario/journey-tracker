import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { fullName: 'Test User', firstName: 'Test', imageUrl: null },
    isLoaded: true,
  }),
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: (s: { chat: { isOpen: boolean } }) => unknown) =>
    selector({ chat: { isOpen: false } }),
}));

describe('Header', () => {
  it('renders chat toggle button when authenticated', () => {
    render(<Header />);
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
  });
});
