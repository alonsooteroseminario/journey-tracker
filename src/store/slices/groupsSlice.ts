import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GoalGroup } from "@/types";

export const groupsApi = createApi({
  reducerPath: "groupsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["GoalGroup"],
  endpoints: (builder) => ({
    getGroups: builder.query<GoalGroup[], void>({
      query: () => "/groups",
      providesTags: ["GoalGroup"],
    }),
    createGroup: builder.mutation<
      GoalGroup,
      { name: string; color?: string; icon?: string }
    >({
      query: (body) => ({ url: "/groups", method: "POST", body }),
      invalidatesTags: ["GoalGroup"],
    }),
    updateGroup: builder.mutation<
      GoalGroup,
      { id: string; updates: Partial<GoalGroup> }
    >({
      query: ({ id, updates }) => ({
        url: `/groups/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["GoalGroup"],
    }),
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["GoalGroup"],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupsApi;
