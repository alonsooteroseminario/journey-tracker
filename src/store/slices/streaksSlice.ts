import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { StreakData, ActivityLogEntry, GoalStreak, StreakTierSummary } from "@/types";

// ========== RTK Query API ==========
export const streaksApi = createApi({
  reducerPath: "streaksApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Streak", "Activity", "GoalStreak"],
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

    // GET /api/streaks/goals — per-goal streaks
    getGoalStreaks: builder.query<GoalStreak[], void>({
      query: () => "/streaks/goals",
      providesTags: ["GoalStreak"],
    }),

    // GET /api/streaks/tiers — computed tier summary
    getStreakTiers: builder.query<StreakTierSummary, void>({
      query: () => "/streaks/tiers",
      providesTags: ["GoalStreak"],
    }),

    // POST /api/streaks/goals/update — trigger streak update for a goal
    updateGoalStreak: builder.mutation<{ success: boolean }, string>({
      query: (goalId) => ({
        url: "/streaks/goals/update",
        method: "POST",
        body: { goalId },
      }),
      invalidatesTags: ["GoalStreak"],
    }),
  }),
});

export const {
  useGetStreakQuery,
  useUpdateStreakMutation,
  useGetActivityLogQuery,
  useLogActivityMutation,
  useGetGoalStreaksQuery,
  useGetStreakTiersQuery,
  useUpdateGoalStreakMutation,
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
