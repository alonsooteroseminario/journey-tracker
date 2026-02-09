import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ActiveView = "home" | "feed" | "templates" | "marketplace";

interface UiState {
  activeView: ActiveView;
  isMenuOpen: boolean;
}

const initialState: UiState = {
  activeView: "home",
  isMenuOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload;
      state.isMenuOpen = false; // Close menu when view changes
    },
    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    closeMenu: (state) => {
      state.isMenuOpen = false;
    },
  },
});

export const { setActiveView, toggleMenu, closeMenu } = uiSlice.actions;
export default uiSlice.reducer;
