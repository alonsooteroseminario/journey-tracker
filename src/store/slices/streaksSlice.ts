import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { StreakData, ActivityLogEntry } from "@/types";

// ========== RTK Query API ==========
export const streaksApi = createApi({
  reducerPath: "streaksApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Streak", "Activity"],
  endpoints: (builder) => ({
    // GET /api/streaks
    getStreak: builder.query<StreakData, void>({
      query: () => "/streaks",
      providesTags: ["Streak"],
    }),

    // PATCH /api/streaks - Update streak (called when a task/substep is completed)
    updateStreak: builder.mutation<StreakData, void>({
      query: () => ({
        url: "/streaks",
        method: "PATCH",
      }),
      invalidatesTags: ["Streak"],
    }),

    // GET /api/activity
    getActivityLog: builder.query<ActivityLogEntry[], { limit?: number }>({
      query: ({ limit } = {}) =>
        `/activity${limit ? `?limit=${limit}` : ""}`,
      providesTags: ["Activity"],
    }),

    // POST /api/activity - Log a new activity
    logActivity: builder.mutation<
      ActivityLogEntry,
      {
        type: ActivityLogEntry["type"];
        description: string;
        goalId: string;
        taskId?: string;
        substepId?: string;
        metadata?: Record<string, unknown>;
      }
    >({
      query: (body) => ({
        url: "/activity",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Activity"],
    }),
  }),
});

export const {
  useGetStreakQuery,
  useUpdateStreakMutation,
  useGetActivityLogQuery,
  useLogActivityMutation,
} = streaksApi;

// ========== Local UI State Slice ==========
interface StreaksUIState {
  calendarView: "week" | "month";
  selectedDate: string | null;
}

const initialState: StreaksUIState = {
  calendarView: "week",
  selectedDate: null,
};

const streaksSlice = createSlice({
  name: "streaks",
  initialState,
  reducers: {
    setCalendarView: (state, action: PayloadAction<"week" | "month">) => {
      state.calendarView = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
  },
});

export const { setCalendarView, setSelectedDate } = streaksSlice.actions;
export default streaksSlice.reducer;
