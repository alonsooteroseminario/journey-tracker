import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatWidget } from './ChatWidget';

// Mock useChat — isOpen comes from Redux now, not this hook
const mockToggleOpen = vi.fn();
const mockClearMessages = vi.fn();
const mockSendMessage = vi.fn();

vi.mock('@/hooks/useChat', () => ({
  useChat: () => ({
    messages: [],
    status: 'idle',
    currentTool: null,
    processingLog: [],
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
    isOpen: true,       // not used by the new ChatWidget — kept for compat
    toggleOpen: mockToggleOpen,
  }),
}));

// The new ChatWidget reads isOpen and viewMode from Redux directly
const mockDispatch = vi.fn();

let mockIsOpen = true;
let mockViewMode = 'floating';

vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (s: { chat: { isOpen: boolean; viewMode: string; unreadCount: number } }) => unknown) =>
    selector({ chat: { isOpen: mockIsOpen, viewMode: mockViewMode, unreadCount: 0 } }),
}));

// Mock child components to avoid deep dependency chains
vi.mock('./ChatMessage', () => ({ ChatMessage: () => null }));
vi.mock('./ChatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));
vi.mock('./ChatStatusIndicator', () => ({ ChatStatusIndicator: () => null }));

describe('ChatWidget — open, floating mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
    mockViewMode = 'floating';
  });

  it('renders panel header title', () => {
    render(<ChatWidget />);
    expect(screen.getByText('Journey Tracker Assistant')).toBeTruthy();
  });

  it('renders chat input', () => {
    render(<ChatWidget />);
    expect(screen.getByTestId('chat-input')).toBeTruthy();
  });

  it('renders view mode toggle button', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText('Switch to split view')).toBeTruthy();
  });

  it('renders close button', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText('Close chat')).toBeTruthy();
  });

  it('does NOT render a floating open-chat button', () => {
    render(<ChatWidget />);
    expect(screen.queryByLabelText('Open chat')).toBeNull();
  });
});

describe('ChatWidget — open, split mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
    mockViewMode = 'split';
  });

  it('renders toggle button with "Switch to floating view" in split mode', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText('Switch to floating view')).toBeTruthy();
  });
});

describe('ChatWidget — closed', () => {
  it('renders nothing when isOpen is false', () => {
    mockIsOpen = false;
    mockViewMode = 'floating';
    const { container } = render(<ChatWidget />);
    expect(container.firstChild).toBeNull();
  });
});
