import { configureStore } from "@reduxjs/toolkit";
import goalsReducer, { goalsApi } from "./slices/goalsSlice";
import profileReducer, { profileApi } from "./slices/profileSlice";
import friendsReducer, { friendsApi } from "./slices/friendsSlice";
import streaksReducer, { streaksApi } from "./slices/streaksSlice";
import feedReducer, { feedApi } from "./slices/feedSlice";
import { templatesApi } from "./slices/templatesSlice";
import adminUIReducer, { adminApi } from "./slices/adminSlice";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    // UI state slices
    goals: goalsReducer,
    profile: profileReducer,
    friends: friendsReducer,
    streaks: streaksReducer,
    feed: feedReducer,
    chat: chatReducer,
    ui: uiReducer,
    adminUI: adminUIReducer,
    // RTK Query API slices (cache + auto-fetching)
    [goalsApi.reducerPath]: goalsApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [friendsApi.reducerPath]: friendsApi.reducer,
    [streaksApi.reducerPath]: streaksApi.reducer,
    [feedApi.reducerPath]: feedApi.reducer,
    [templatesApi.reducerPath]: templatesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      goalsApi.middleware,
      profileApi.middleware,
      friendsApi.middleware,
      streaksApi.middleware,
      feedApi.middleware,
      templatesApi.middleware,
      adminApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
