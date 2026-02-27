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
