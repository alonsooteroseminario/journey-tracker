import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { UserProfile, EmailPreferences, FeedPreferences } from "@/types";

// ========== RTK Query API ==========
export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Profile", "EmailPreferences", "FeedPreferences"],
  endpoints: (builder) => ({
    // GET /api/profile
    getProfile: builder.query<UserProfile, void>({
      query: () => "/profile",
      providesTags: ["Profile"],
    }),

    // PATCH /api/profile
    updateProfile: builder.mutation<UserProfile, Partial<UserProfile>>({
      query: (updates) => ({
        url: "/profile",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["Profile"],
    }),

    // POST /api/profile/image - Upload profile image
    uploadProfileImage: builder.mutation<
      { profileImage: string },
      { image: string }
    >({
      query: (body) => ({
        url: "/profile/image",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    // GET /api/email-preferences
    getEmailPreferences: builder.query<EmailPreferences, void>({
      query: () => "/email-preferences",
      providesTags: ["EmailPreferences"],
    }),

    // PATCH /api/email-preferences
    updateEmailPreferences: builder.mutation<
      EmailPreferences,
      Partial<EmailPreferences>
    >({
      query: (updates) => ({
        url: "/email-preferences",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["EmailPreferences"],
    }),

    // GET /api/feed-preferences
    getFeedPreferences: builder.query<FeedPreferences, void>({
      query: () => "/feed-preferences",
      providesTags: ["FeedPreferences"],
    }),

    // PATCH /api/feed-preferences
    updateFeedPreferences: builder.mutation<
      FeedPreferences,
      Partial<FeedPreferences>
    >({
      query: (updates) => ({
        url: "/feed-preferences",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["FeedPreferences"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useGetEmailPreferencesQuery,
  useUpdateEmailPreferencesMutation,
  useGetFeedPreferencesQuery,
  useUpdateFeedPreferencesMutation,
} = profileApi;

// ========== Local UI State Slice ==========
interface ProfileUIState {
  isEditing: boolean;
  uploadProgress: number;
}

const initialState: ProfileUIState = {
  isEditing: false,
  uploadProgress: 0,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
  },
});

export const { setEditing, setUploadProgress } = profileSlice.actions;
export default profileSlice.reducer;
