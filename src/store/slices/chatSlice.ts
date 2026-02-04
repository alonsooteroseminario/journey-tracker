/**
 * Chat UI slice - Redux state for chat widget
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatUIState {
  isOpen: boolean;
  unreadCount: number;
}

const initialState: ChatUIState = {
  isOpen: false,
  unreadCount: 0,
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
  },
});

export const { toggleChat, openChat, closeChat, incrementUnread, clearUnread } = chatSlice.actions;
export default chatSlice.reducer;
