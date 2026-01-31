import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Goal, Task, Substep } from "@/types";

// ========== RTK Query API ==========
export const goalsApi = createApi({
  reducerPath: "goalsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Goal"],
  endpoints: (builder) => ({
    // GET /api/goals
    getGoals: builder.query<Goal[], void>({
      query: () => "/goals",
      providesTags: ["Goal"],
    }),

    // GET /api/goals/:id
    getGoal: builder.query<Goal, string>({
      query: (id) => `/goals/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Goal", id }],
    }),

    // POST /api/goals
    createGoal: builder.mutation<Goal, Partial<Goal>>({
      query: (goal) => ({
        url: "/goals",
        method: "POST",
        body: goal,
      }),
      invalidatesTags: ["Goal"],
    }),

    // PATCH /api/goals/:id
    updateGoal: builder.mutation<Goal, { id: string; updates: Partial<Goal> }>({
      query: ({ id, updates }) => ({
        url: `/goals/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Goal", id },
        "Goal",
      ],
    }),

    // DELETE /api/goals/:id
    deleteGoal: builder.mutation<void, string>({
      query: (id) => ({
        url: `/goals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Goal"],
    }),

    // PATCH /api/goals/:goalId/tasks/:taskId
    updateTask: builder.mutation<
      Goal,
      { goalId: string; taskId: string; updates: Partial<Task> }
    >({
      query: ({ goalId, taskId, updates }) => ({
        url: `/goals/${goalId}/tasks/${taskId}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (_result, _error, { goalId }) => [
        { type: "Goal", id: goalId },
      ],
    }),

    // POST /api/migrate - Migrate localStorage data to MongoDB
    migrateLocalData: builder.mutation<{ success: boolean }, unknown>({
      query: (localData) => ({
        url: "/migrate",
        method: "POST",
        body: localData,
      }),
      invalidatesTags: ["Goal"],
    }),
  }),
});

export const {
  useGetGoalsQuery,
  useGetGoalQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
  useUpdateTaskMutation,
  useMigrateLocalDataMutation,
} = goalsApi;

// ========== Local UI State Slice ==========
interface GoalsUIState {
  selectedGoalId: string | null;
  isCreating: boolean;
  filters: {
    showCompleted: boolean;
    sortBy: "date" | "progress" | "title";
  };
}

const initialState: GoalsUIState = {
  selectedGoalId: null,
  isCreating: false,
  filters: {
    showCompleted: true,
    sortBy: "date",
  },
};

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    setSelectedGoal: (state, action: PayloadAction<string | null>) => {
      state.selectedGoalId = action.payload;
    },
    toggleCreating: (state) => {
      state.isCreating = !state.isCreating;
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<GoalsUIState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setSelectedGoal, toggleCreating, setFilters } =
  goalsSlice.actions;
export default goalsSlice.reducer;
