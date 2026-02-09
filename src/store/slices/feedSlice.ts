import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FeedItem, FeedComment, FeedCheer } from "@/types";

// ========== RTK Query API ==========
export const feedApi = createApi({
  reducerPath: "feedApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Feed"],
  endpoints: (builder) => ({
    // GET /api/feed
    getFeed: builder.query<
      FeedItem[],
      { limit?: number; offset?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.offset) queryParams.set("offset", params.offset.toString());
        return `/feed${queryParams.toString() ? `?${queryParams}` : ""}`;
      },
      providesTags: ["Feed"],
    }),

    // GET /api/feed/:feedItemId/comments
    getComments: builder.query<FeedComment[], string>({
      query: (feedItemId) => `/feed/${feedItemId}/comments`,
      providesTags: (_result, _error, feedItemId) => [
        { type: "Feed", id: feedItemId },
      ],
    }),

    // POST /api/feed/:feedItemId/comments
    addComment: builder.mutation<
      FeedComment,
      { feedItemId: string; content: string }
    >({
      query: ({ feedItemId, content }) => ({
        url: `/feed/${feedItemId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { feedItemId }) => [
        { type: "Feed", id: feedItemId },
        "Feed",
      ],
    }),

    // POST /api/feed/:feedItemId/cheers
    toggleCheer: builder.mutation<
      { action: string; message: string },
      { feedItemId: string; emoji?: string }
    >({
      query: ({ feedItemId, emoji }) => ({
        url: `/feed/${feedItemId}/cheers`,
        method: "POST",
        body: { emoji: emoji || "🎉" },
      }),
      invalidatesTags: (_result, _error, { feedItemId }) => [
        { type: "Feed", id: feedItemId },
        "Feed",
      ],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useToggleCheerMutation,
} = feedApi;

// ========== Local UI State Slice ==========
interface FeedUIState {
  expandedFeedItems: string[]; // IDs of feed items with expanded comments
  filters: {
    type: "all" | "streak_milestone" | "goal_created" | "task_completed";
  };
}

const initialState: FeedUIState = {
  expandedFeedItems: [],
  filters: {
    type: "all",
  },
};

const feedSlice = createSlice({
  name: "feedUI",
  initialState,
  reducers: {
    toggleFeedItemExpanded: (state, action: PayloadAction<string>) => {
      const feedItemId = action.payload;
      if (state.expandedFeedItems.includes(feedItemId)) {
        state.expandedFeedItems = state.expandedFeedItems.filter(
          (id) => id !== feedItemId
        );
      } else {
        state.expandedFeedItems.push(feedItemId);
      }
    },
    setFeedFilter: (
      state,
      action: PayloadAction<
        "all" | "streak_milestone" | "goal_created" | "task_completed"
      >
    ) => {
      state.filters.type = action.payload;
    },
    resetFeedUI: () => initialState,
  },
});

export const { toggleFeedItemExpanded, setFeedFilter, resetFeedUI } =
  feedSlice.actions;

export default feedSlice.reducer;
