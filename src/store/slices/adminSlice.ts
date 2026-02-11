import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AnalyticsData, TimeRange } from "@/types/admin";

// RTK Query API for admin endpoints
export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/admin" }),
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsData, void>({
      query: () => "/analytics",
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsQuery } = adminApi;

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
