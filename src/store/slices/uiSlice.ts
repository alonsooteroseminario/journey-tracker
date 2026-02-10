import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ActiveView = "home" | "feed" | "templates" | "marketplace";

interface UiState {
  activeView: ActiveView;
}

const initialState: UiState = {
  activeView: "home",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload;
    },
  },
});

export const { setActiveView } = uiSlice.actions;
export default uiSlice.reducer;
