import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AnalyticsData,
  TimeRange,
  SocialAccount,
  SocialPlatform,
  SocialPostWithAccount,
  CreatePostRequest,
  UpdatePostRequest,
  Video,
  CreateVideoRequest
} from "@/types/admin";

// RTK Query API for admin endpoints
export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: ["Analytics", "Explorer", "SocialAccounts", "SocialPosts", "Videos"],
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsData, void>({
      query: () => "/analytics",
      providesTags: ["Analytics"],
    }),
    getModelRecords: builder.query<
      { data: any[]; pagination: any },
      {
        model: string;
        page?: number;
        limit?: number;
        search?: string;
        sort?: string;
        order?: "asc" | "desc";
      }
    >({
      query: ({ model, page = 1, limit = 20, search = "", sort = "createdAt", order = "desc" }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          search,
          sort,
          order,
        });
        return `/explorer/${model}?${params}`;
      },
      providesTags: (result, error, { model }) => [{ type: "Explorer", id: model }],
    }),
    getRecord: builder.query<any, { model: string; id: string }>({
      query: ({ model, id }) => `/explorer/${model}/${id}`,
      providesTags: (result, error, { model, id }) => [{ type: "Explorer", id: `${model}-${id}` }],
    }),
    updateRecord: builder.mutation<any, { model: string; id: string; data: any }>({
      query: ({ model, id, data }) => ({
        url: `/explorer/${model}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { model, id }) => [
        { type: "Explorer", id: model },
        { type: "Explorer", id: `${model}-${id}` },
      ],
    }),
    deleteRecord: builder.mutation<void, { model: string; id: string }>({
      query: ({ model, id }) => ({
        url: `/explorer/${model}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { model }) => [{ type: "Explorer", id: model }],
    }),
    // Social accounts endpoints
    getSocialAccounts: builder.query<{ accounts: SocialAccount[] }, void>({
      query: () => "/social/accounts",
      providesTags: ["SocialAccounts"],
    }),
    initiateSocialConnect: builder.query<{ authUrl: string; state: string }, SocialPlatform>({
      query: (platform) => `/social/connect/${platform}`,
    }),
    deleteSocialAccount: builder.mutation<{ success: boolean }, string>({
      query: (accountId) => ({
        url: `/social/accounts/${accountId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SocialAccounts"],
    }),
    refreshSocialToken: builder.mutation<{ success: boolean; expiresAt: Date | null }, string>({
      query: (accountId) => ({
        url: `/social/accounts/${accountId}/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["SocialAccounts"],
    }),
    // Social posts endpoints
    getSocialPosts: builder.query<
      { posts: SocialPostWithAccount[] },
      { status?: string; accountId?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && "status" in params && params.status) {
          searchParams.set("status", params.status);
        }
        if (params && "accountId" in params && params.accountId) {
          searchParams.set("accountId", params.accountId);
        }
        return `/social/posts?${searchParams}`;
      },
      providesTags: ["SocialPosts"],
    }),
    createSocialPost: builder.mutation<{ post: SocialPostWithAccount }, CreatePostRequest>({
      query: (data) => ({
        url: "/social/posts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SocialPosts"],
    }),
    updateSocialPost: builder.mutation<{ post: SocialPostWithAccount }, { id: string; data: UpdatePostRequest }>({
      query: ({ id, data }) => ({
        url: `/social/posts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SocialPosts"],
    }),
    deleteSocialPost: builder.mutation<{ success: boolean }, string>({
      query: (postId) => ({
        url: `/social/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SocialPosts"],
    }),
    publishSocialPost: builder.mutation<{ post: SocialPostWithAccount }, string>({
      query: (postId) => ({
        url: `/social/posts/${postId}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["SocialPosts"],
    }),
    // Video endpoints
    getVideos: builder.query<{ videos: Video[] }, void>({
      query: () => "/videos",
      providesTags: ["Videos"],
    }),
    createVideo: builder.mutation<{ video: Video }, CreateVideoRequest>({
      query: (data) => ({
        url: "/videos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Videos"],
    }),
    deleteVideo: builder.mutation<{ success: boolean }, string>({
      query: (videoId) => ({
        url: `/videos/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Videos"],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetModelRecordsQuery,
  useGetRecordQuery,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useGetSocialAccountsQuery,
  useLazyInitiateSocialConnectQuery,
  useDeleteSocialAccountMutation,
  useRefreshSocialTokenMutation,
  useGetSocialPostsQuery,
  useCreateSocialPostMutation,
  useUpdateSocialPostMutation,
  useDeleteSocialPostMutation,
  usePublishSocialPostMutation,
  useGetVideosQuery,
  useCreateVideoMutation,
  useDeleteVideoMutation,
} = adminApi;

// UI state slice for admin dashboard
interface AdminUIState {
  selectedTimeRange: TimeRange;
  activeTab: string;
}

const initialState: AdminUIState = {
  selectedTimeRange: "30d",
  activeTab: "dashboard",
};

const adminUISlice = createSlice({
  name: "adminUI",
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<TimeRange>) => {
      state.selectedTimeRange = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setTimeRange, setActiveTab } = adminUISlice.actions;
export default adminUISlice.reducer;
