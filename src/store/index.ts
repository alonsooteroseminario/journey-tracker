import { configureStore } from "@reduxjs/toolkit";
import goalsReducer, { goalsApi } from "./slices/goalsSlice";
import profileReducer, { profileApi } from "./slices/profileSlice";
import friendsReducer, { friendsApi } from "./slices/friendsSlice";
import streaksReducer, { streaksApi } from "./slices/streaksSlice";

export const store = configureStore({
  reducer: {
    // UI state slices
    goals: goalsReducer,
    profile: profileReducer,
    friends: friendsReducer,
    streaks: streaksReducer,
    // RTK Query API slices (cache + auto-fetching)
    [goalsApi.reducerPath]: goalsApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [friendsApi.reducerPath]: friendsApi.reducer,
    [streaksApi.reducerPath]: streaksApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      goalsApi.middleware,
      profileApi.middleware,
      friendsApi.middleware,
      streaksApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
