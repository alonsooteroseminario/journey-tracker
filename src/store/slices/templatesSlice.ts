import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { GoalTemplate } from "@/types";

export interface CreateTemplateRequest {
  goalId: string;
  lessonsLearned?: string;
  tips?: string;
  estimatedDuration?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  category?: string;
  tags?: string[];
  visibility?: "friends" | "public";
}

export interface UpdateTemplateRequest {
  lessonsLearned?: string;
  tips?: string;
  estimatedDuration?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  category?: string;
  tags?: string[];
}

export interface ForkTemplateRequest {
  customTitle?: string;
}

export interface ForkTemplateResponse {
  goalId: string;
  title: string;
  taskCount: number;
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface MarketplaceResponse {
  templates: GoalTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const templatesApi = createApi({
  reducerPath: "templatesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Templates", "Template"],
  endpoints: (builder) => ({
    getTemplates: builder.query<GoalTemplate[], { includeOwn?: boolean; visibility?: string }>({
      query: ({ includeOwn = true, visibility = "all" } = {}) =>
        `/templates?includeOwn=${includeOwn}&visibility=${visibility}`,
      providesTags: ["Templates"],
    }),
    getTemplateById: builder.query<GoalTemplate, string>({
      query: (id) => `/templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Template", id }],
    }),
    createTemplate: builder.mutation<GoalTemplate, CreateTemplateRequest>({
      query: (data) => ({
        url: "/templates",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Templates"],
    }),
    updateTemplate: builder.mutation<GoalTemplate, { id: string; data: UpdateTemplateRequest }>({
      query: ({ id, data }) => ({
        url: `/templates/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Template", id },
        "Templates",
      ],
    }),
    deleteTemplate: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Templates"],
    }),
    forkTemplate: builder.mutation<ForkTemplateResponse, { id: string; data: ForkTemplateRequest }>({
      query: ({ id, data }) => ({
        url: `/templates/${id}/fork`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Template", id },
        "Templates",
      ],
    }),
    getMarketplaceTemplates: builder.query<MarketplaceResponse, MarketplaceFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.category) params.append("category", filters.category);
        if (filters.difficulty) params.append("difficulty", filters.difficulty);
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        return `/marketplace?${params.toString()}`;
      },
      providesTags: ["Templates"],
    }),
    publishTemplate: builder.mutation<GoalTemplate, string>({
      query: (id) => ({
        url: `/marketplace/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Template", id },
        "Templates",
      ],
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useForkTemplateMutation,
  useGetMarketplaceTemplatesQuery,
  usePublishTemplateMutation,
} = templatesApi;
