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
