import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { UserProfile } from "@/types";

// ========== RTK Query API ==========
export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Profile"],
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
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
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
