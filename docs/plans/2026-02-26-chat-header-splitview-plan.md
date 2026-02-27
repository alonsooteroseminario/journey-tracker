# Chat Header Integration + Split-View Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the chat trigger button from a draggable floating widget into the Header, and add a toggle inside the chat panel to switch between "floating" (compact overlay) and "split" (full-width bottom panel) view modes.

**Architecture:** The existing `chatSlice` already tracks `isOpen` in Redux but `useChat.ts` ignores it and uses local state. We extend `chatSlice` with a `viewMode` field, wire `useChat.ts` to Redux, gut the drag logic from `ChatWidget.tsx` (it becomes a panel-only component), and add a chat button to `Header.tsx`.

**Tech Stack:** Next.js 15 App Router, Redux Toolkit (`src/store/slices/chatSlice.ts`), Tailwind CSS, React 18 hooks, Vitest for tests.

---

## Context: Current State

| File | Current Behaviour |
|------|-------------------|
| `src/store/slices/chatSlice.ts` | Has `isOpen` + `unreadCount` — **NOT connected to useChat** |
| `src/hooks/useChat.ts` | Uses local `useState` for `isOpen`; `toggleOpen` is a local callback |
| `src/components/chat/ChatWidget.tsx` | 406-line draggable floating button + panel; `isOpen` from local hook state |
| `src/components/Header.tsx` | No chat button; `z-40`, two-row layout (~88px tall) |
| `src/components/AppShell.tsx` | Renders `<ChatWidget />` globally alongside page content |

## Target State

- **Header** gets a bot-icon button (authenticated only) that dispatches `toggleChat` to Redux.
- **ChatWidget** loses ALL drag logic and the floating closed-state button. It renders nothing when `isOpen` is false, and renders the chat panel when `isOpen` is true.
- Panel has **two view modes** toggled by a button inside the panel header:
  - `floating` — fixed overlay, top-right below header (400×600px, right-16 top-22)
  - `split` — fixed at the bottom, full width, 45vh tall; body gets matching padding-bottom so page content scrolls above it.
- `useChat.ts` reads `isOpen` from Redux and dispatches `toggleChat`; local `isOpen` state is removed.

---

## Task 1: Extend `chatSlice` with `viewMode`

**Files:**
- Modify: `src/store/slices/chatSlice.ts`
- Create: `src/store/slices/chatSlice.test.ts`

### Step 1: Write failing tests

Create `src/store/slices/chatSlice.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import chatReducer, {
  toggleChat,
  openChat,
  closeChat,
  setViewMode,
} from './chatSlice';

describe('chatSlice', () => {
  it('returns default state', () => {
    const state = chatReducer(undefined, { type: 'unknown' });
    expect(state).toEqual({ isOpen: false, unreadCount: 0, viewMode: 'floating' });
  });

  it('toggleChat opens when closed', () => {
    const state = chatReducer({ isOpen: false, unreadCount: 0, viewMode: 'floating' }, toggleChat());
    expect(state.isOpen).toBe(true);
  });

  it('toggleChat closes when open', () => {
    const state = chatReducer({ isOpen: true, unreadCount: 0, viewMode: 'floating' }, toggleChat());
    expect(state.isOpen).toBe(false);
  });

  it('openChat sets isOpen true and clears unread', () => {
    const state = chatReducer({ isOpen: false, unreadCount: 3, viewMode: 'floating' }, openChat());
    expect(state.isOpen).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('closeChat sets isOpen false', () => {
    const state = chatReducer({ isOpen: true, unreadCount: 0, viewMode: 'floating' }, closeChat());
    expect(state.isOpen).toBe(false);
  });

  it('setViewMode switches to split', () => {
    const state = chatReducer({ isOpen: false, unreadCount: 0, viewMode: 'floating' }, setViewMode('split'));
    expect(state.viewMode).toBe('split');
  });

  it('setViewMode switches back to floating', () => {
    const state = chatReducer({ isOpen: false, unreadCount: 0, viewMode: 'split' }, setViewMode('floating'));
    expect(state.viewMode).toBe('floating');
  });
});
```

### Step 2: Run to confirm failure

```bash
npx vitest run src/store/slices/chatSlice.test.ts
```
Expected: FAIL — `setViewMode` not exported, `viewMode` not in state.

### Step 3: Update `chatSlice.ts`

Replace full file content:

```ts
/**
 * Chat UI slice - Redux state for chat widget
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ChatViewMode = 'floating' | 'split';

interface ChatUIState {
  isOpen: boolean;
  unreadCount: number;
  viewMode: ChatViewMode;
}

const initialState: ChatUIState = {
  isOpen: false,
  unreadCount: 0,
  viewMode: 'floating',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat(state) {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.unreadCount = 0;
      }
    },
    openChat(state) {
      state.isOpen = true;
      state.unreadCount = 0;
    },
    closeChat(state) {
      state.isOpen = false;
    },
    incrementUnread(state) {
      if (!state.isOpen) {
        state.unreadCount++;
      }
    },
    clearUnread(state) {
      state.unreadCount = 0;
    },
    setViewMode(state, action: PayloadAction<ChatViewMode>) {
      state.viewMode = action.payload;
    },
  },
});

export const { toggleChat, openChat, closeChat, incrementUnread, clearUnread, setViewMode } =
  chatSlice.actions;
export default chatSlice.reducer;
```

### Step 4: Run tests to confirm pass

```bash
npx vitest run src/store/slices/chatSlice.test.ts
```
Expected: 7 tests PASS.

### Step 5: Commit

```bash
git add src/store/slices/chatSlice.ts src/store/slices/chatSlice.test.ts
git commit -m "feat(chat): add viewMode to chatSlice (floating | split)"
```

---

## Task 2: Wire `useChat.ts` to Redux for `isOpen`

**Files:**
- Modify: `src/hooks/useChat.ts`

The hook currently manages `isOpen` and `toggleOpen` with local `useState`. We replace them with Redux selectors and dispatch.

### Step 1: No dedicated test needed here

`useChat` is already covered by its consumers (ChatWidget). We verify correctness in Task 3 when we test ChatWidget renders.

### Step 2: Edit `useChat.ts`

**Remove** (lines 64, 71–73):
```ts
const [isOpen, setIsOpen] = useState(false);
// ...
const toggleOpen = useCallback(() => {
  setIsOpen((prev) => !prev);
}, []);
```

**Add** the following imports at the top of the file (after existing imports):
```ts
import { useAppSelector } from '@/store/hooks';
import { toggleChat } from '@/store/slices/chatSlice';
```

**Add** inside `useChat()` body (after the `dispatch` line):
```ts
const isOpen = useAppSelector((s) => s.chat.isOpen);

const toggleOpen = useCallback(() => {
  dispatch(toggleChat());
}, [dispatch]);
```

The return shape stays exactly the same — `isOpen` and `toggleOpen` are still exported by the hook. No callers need to change.

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```
Expected: 0 errors.

### Step 4: Commit

```bash
git add src/hooks/useChat.ts
git commit -m "refactor(chat): isOpen/toggleOpen now use Redux chatSlice instead of local state"
```

---

## Task 3: Add chat button to `Header.tsx`

**Files:**
- Modify: `src/components/Header.tsx`

The button lives in the authenticated actions area, between Friends and Profile. It dispatches `toggleChat` and shows an active state when `isOpen`.

### Step 1: Write a focused smoke test

Check `src/components/chat/ChatInput.test.tsx` as a reference for how chat tests are structured. There is no Header test file — create a minimal one:

Create `src/components/Header.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { fullName: 'Test User', firstName: 'Test', imageUrl: null },
    isLoaded: true,
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock Redux store
vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: (s: { chat: { isOpen: boolean } }) => boolean) =>
    selector({ chat: { isOpen: false } }),
}));

describe('Header', () => {
  it('renders chat toggle button when authenticated', () => {
    render(<Header />);
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
  });

  it('shows active state when chat is open', () => {
    // Re-mock useAppSelector to return isOpen=true
    vi.mocked(vi.fn()).mockReturnValue(true); // handled inline below
  });
});
```

> **Note:** The second test is a placeholder — you can verify active state visually. The key test is that the button renders.

### Step 2: Run test to confirm failure

```bash
npx vitest run src/components/Header.test.tsx
```
Expected: FAIL — "Open chat" button not found.

### Step 3: Modify `Header.tsx`

**Add imports** after existing imports:
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleChat } from '@/store/slices/chatSlice';
```

**Add inside `Header` component** (after the existing `isAuthenticated`, `profileName`, `profileImage` lines):
```ts
const dispatch = useAppDispatch();
const isChatOpen = useAppSelector((s) => s.chat.isOpen);
```

**Add the chat button** in the authenticated section, BEFORE the Friends `<Link>` (so it sits between logo area and Friends):

Actually, insert it AFTER the Friends `<Link>` and BEFORE the Profile `<Link>`:

```tsx
{/* Chat toggle button */}
<button
  onClick={() => dispatch(toggleChat())}
  aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
  className={`p-1 sm:p-2 rounded-lg transition-colors ${
    isChatOpen
      ? 'bg-brand-primary text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-primary'
  }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 sm:w-6 sm:h-6"
  >
    <circle cx="12" cy="1.2" r="1" fill="currentColor" stroke="none" />
    <line x1="12" y1="2.2" x2="12" y2="4.2" />
    <rect x="3" y="4.2" width="18" height="11.5" rx="4" />
    <circle cx="8.5" cy="9.8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="9.8" r="1.2" fill="currentColor" stroke="none" />
    <path d="M8.5 12.8Q12 14.8 15.5 12.8" />
  </svg>
</button>
```

The insertion point in `Header.tsx` is after the closing `</Link>` of the Friends button (line ~105), before the opening `{/* Profile */}` comment.

### Step 4: Run test to confirm pass

```bash
npx vitest run src/components/Header.test.tsx
```
Expected: PASS on the "renders chat toggle button" test.

### Step 5: Run full test suite

```bash
npx vitest run
```
Expected: All existing tests still pass.

### Step 6: Commit

```bash
git add src/components/Header.tsx src/components/Header.test.tsx
git commit -m "feat(chat): add chat toggle button to Header"
```

---

## Task 4: Refactor `ChatWidget.tsx` — remove drag, add split view

**Files:**
- Modify: `src/components/chat/ChatWidget.tsx`

This is the biggest change. We gut the draggable logic and replace the closed-state button render with nothing. The open-state panel gets two view modes and a toggle button.

### Step 1: Write tests for the new ChatWidget behaviour

There is no existing `ChatWidget.test.tsx` — create one:

Create `src/components/chat/ChatWidget.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatWidget } from './ChatWidget';

// Mock useChat
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
    isOpen: true,
    toggleOpen: mockToggleOpen,
  }),
}));

// Mock Redux store
vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: vi.fn((selector) =>
    selector({ chat: { isOpen: true, viewMode: 'floating', unreadCount: 0 } })
  ),
}));

// Mock child components
vi.mock('./ChatMessage', () => ({ ChatMessage: () => null }));
vi.mock('./ChatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));
vi.mock('./ChatStatusIndicator', () => ({ ChatStatusIndicator: () => null }));

describe('ChatWidget (open state)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chat panel when isOpen is true', () => {
    render(<ChatWidget />);
    expect(screen.getByText('Journey Tracker Assistant')).toBeTruthy();
  });

  it('renders chat input', () => {
    render(<ChatWidget />);
    expect(screen.getByTestId('chat-input')).toBeTruthy();
  });

  it('does NOT render a draggable floating button', () => {
    render(<ChatWidget />);
    // The closed-state button should never appear
    expect(screen.queryByLabelText('Open chat')).toBeNull();
  });

  it('renders view mode toggle button', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText(/Switch to split view/i)).toBeTruthy();
  });

  it('renders close button in panel header', () => {
    render(<ChatWidget />);
    expect(screen.getByLabelText('Close chat')).toBeTruthy();
  });
});

describe('ChatWidget (closed state)', () => {
  it('renders nothing when isOpen is false', () => {
    vi.mocked(require('@/store/hooks').useAppSelector).mockImplementation((selector) =>
      selector({ chat: { isOpen: false, viewMode: 'floating', unreadCount: 0 } })
    );
    const { container } = render(<ChatWidget />);
    expect(container.firstChild).toBeNull();
  });
});
```

### Step 2: Run to confirm failure

```bash
npx vitest run src/components/chat/ChatWidget.test.tsx
```
Expected: Multiple FAILures.

### Step 3: Rewrite `ChatWidget.tsx`

Replace the full file with:

```tsx
/**
 * ChatWidget — chat panel component
 *
 * Rendered globally in AppShell. Has no floating trigger button
 * (the trigger lives in Header.tsx). Renders nothing when closed.
 *
 * View modes (toggled inside the panel header):
 *   floating — fixed overlay at top-right, below the app header
 *   split    — fixed full-width bottom panel (45 vh); body gets matching padding-bottom
 */

'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setViewMode } from '@/store/slices/chatSlice';
import type { ChatViewMode } from '@/store/slices/chatSlice';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatStatusIndicator } from './ChatStatusIndicator';

/* ------------------------------------------------------------------ constants */
const HEADER_HEIGHT = 88; // px — approximate two-row header height
const SPLIT_HEIGHT_VH = 45; // % of viewport used by split panel

/* ------------------------------------------------------------ component */
export function ChatWidget() {
  const { messages, status, currentTool, processingLog, sendMessage, clearMessages, toggleOpen } =
    useChat();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.chat.isOpen);
  const viewMode = useAppSelector((s) => s.chat.viewMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* --- auto-scroll messages --- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* --- body padding for split mode --- */
  useEffect(() => {
    const bodyEl = document.body;
    if (isOpen && viewMode === 'split') {
      bodyEl.style.paddingBottom = `${SPLIT_HEIGHT_VH}vh`;
    } else {
      bodyEl.style.paddingBottom = '';
    }
    return () => {
      bodyEl.style.paddingBottom = '';
    };
  }, [isOpen, viewMode]);

  /* -------------------------------------------------------- not open → render nothing */
  if (!isOpen) return null;

  /* -------------------------------------------------------- panel positioning */
  const isSplit = viewMode === 'split';
  const panelStyle: React.CSSProperties = isSplit
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${SPLIT_HEIGHT_VH}vh`,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: HEADER_HEIGHT + 8,
        right: 16,
        width: 'min(400px, calc(100vw - 32px))',
        height: 'min(600px, calc(100vh - 120px))',
        zIndex: 50,
      };

  const nextMode: ChatViewMode = isSplit ? 'floating' : 'split';
  const toggleLabel = isSplit ? 'Switch to floating view' : 'Switch to split view';

  /* -------------------------------------------------------- split icon */
  const SplitIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );

  /* -------------------------------------------------------- floating icon */
  const FloatingIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );

  /* -------------------------------------------------------- render panel */
  return (
    <div
      style={panelStyle}
      className="flex flex-col bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 rounded-t-lg"
    >
      {/* panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-primary text-white rounded-t-lg flex-shrink-0">
        <h3 className="font-semibold text-sm sm:text-base">Journey Tracker Assistant</h3>
        <div className="flex gap-1">
          {/* view mode toggle */}
          <button
            onClick={() => dispatch(setViewMode(nextMode))}
            className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {isSplit ? <FloatingIcon /> : <SplitIcon />}
          </button>

          {/* clear messages */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
              aria-label="Clear messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}

          {/* close */}
          <button
            onClick={toggleOpen}
            className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="mb-4">Hi! I&apos;m your Journey Tracker assistant.</p>
            <p className="text-sm">Ask me about your goals, tasks, or streaks!</p>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <ChatStatusIndicator status={status} toolName={currentTool} processingLog={processingLog} />
        <div ref={messagesEndRef} />
      </div>

      {/* input */}
      <ChatInput onSend={sendMessage} disabled={status !== 'idle'} />
    </div>
  );
}
```

### Step 4: Run ChatWidget tests

```bash
npx vitest run src/components/chat/ChatWidget.test.tsx
```
Expected: All 5 tests PASS (or 6 including the closed-state test).

> **If the closed-state test is flaky**: The `vi.mocked(require(...))` pattern may not work cleanly in ESM. Simplify by doing two separate `describe` blocks each with a fresh `vi.mock` at module level — or just drop the closed-state test since `return null` is trivially correct.

### Step 5: Run full test suite

```bash
npx vitest run
```
Expected: All existing tests pass.

### Step 6: Commit

```bash
git add src/components/chat/ChatWidget.tsx src/components/chat/ChatWidget.test.tsx
git commit -m "feat(chat): remove drag logic, add split/floating view modes to ChatWidget"
```

---

## Task 5: Manual visual verification

No automated test can confirm pixel-perfect layout. Run the dev server and check these:

```bash
npm run dev
```

Open `http://localhost:3000` (must be logged in).

**Checklist:**
- [ ] Header shows the bot icon button (right section, between Friends and Profile).
- [ ] Clicking the bot button opens the chat panel (floating mode by default, top-right area).
- [ ] Panel appears below the header, not overlapping it.
- [ ] Panel header shows three icons: split-view toggle, trash (only if messages exist), close (×).
- [ ] Clicking the split-view icon makes the panel expand to full width at the bottom.
- [ ] Page content gains bottom padding so it doesn't hide behind the split panel.
- [ ] Clicking the floating icon restores the compact top-right panel.
- [ ] Closing the panel removes body padding-bottom.
- [ ] Closing then reopening restores the previous viewMode (split or floating) via Redux.
- [ ] Chat conversation still works (send message → get AI response via SSE).
- [ ] On mobile (<640px), floating mode still shows a usable panel (width = 100vw - 32px).
- [ ] No draggable floating button appears anywhere — confirmed deleted.

---

## Task 6: Clean up removed localStorage key

The old `ChatWidget` saved button position to `localStorage` under key `'chat-widget-position'`. Existing users' browsers may have this stale key. It is harmless but worth a note.

**Optional**: Add a one-time cleanup in `AppShell.tsx`:

```tsx
useEffect(() => {
  try { localStorage.removeItem('chat-widget-position'); } catch { /* ignore */ }
}, []);
```

Add this inside `AppShell` if you want a clean slate for existing users.

```bash
git add src/components/AppShell.tsx
git commit -m "chore: remove stale chat-widget-position from localStorage on mount"
```

---

## Task 7: Run full test suite and confirm

```bash
npm run test:all
```
Expected: All unit tests and E2E tests pass.

If tests fail:
1. Check if `useAppSelector` mock in Header.test.tsx needs to match the new slice shape.
2. Check if any test imports from `ChatWidget` and expects the old floating-button markup.

### Final commit message if minor fixes needed

```bash
git add -p   # stage only the fix changes
git commit -m "fix(chat): test mocks updated for Header + ChatWidget refactor"
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `src/store/slices/chatSlice.ts` | + `viewMode` field + `setViewMode` action |
| `src/store/slices/chatSlice.test.ts` | **NEW** — 7 unit tests for chatSlice |
| `src/hooks/useChat.ts` | `isOpen`/`toggleOpen` → Redux dispatch instead of local useState |
| `src/components/Header.tsx` | + bot icon button dispatching `toggleChat` |
| `src/components/Header.test.tsx` | **NEW** — smoke test: chat button renders when authenticated |
| `src/components/chat/ChatWidget.tsx` | Remove drag logic, add split/floating view modes |
| `src/components/chat/ChatWidget.test.tsx` | **NEW** — panel render tests |
| `src/components/AppShell.tsx` | Optional: remove stale localStorage key |

No API routes, Prisma schema, or MCP tools are affected.

---

## Execution Order

Each task can be done in a separate prompt/session. The order matters:

```
Task 1 (chatSlice) → Task 2 (useChat) → Task 3 (Header) → Task 4 (ChatWidget) → Task 5 (visual QA) → Task 6 (cleanup)
```

Task 1 and Task 3 are largely independent after Task 1 (they don't depend on each other's implementation).
