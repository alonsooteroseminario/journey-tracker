import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PromptWallet, PromptGroup, PromptChunk } from '@/types';

export const promptsApi = createApi({
  reducerPath: 'promptsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
  endpoints: (builder) => ({

    // ── Wallets ──────────────────────────────────────────────────────
    listWallets: builder.query<PromptWallet[], void>({
      query: () => '/prompt-wallets',
      providesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    createWallet: builder.mutation<PromptWallet, { title: string; icon?: string; description?: string }>({
      query: (body) => ({ url: '/prompt-wallets', method: 'POST', body }),
      invalidatesTags: ['PromptWallet'],
    }),

    updateWallet: builder.mutation<PromptWallet, { id: string; patch: Partial<Pick<PromptWallet, 'title' | 'icon' | 'description' | 'order' | 'lockLevel'>> }>({
      query: ({ id, patch }) => ({ url: `/prompt-wallets/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['PromptWallet'],
    }),

    deleteWallet: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/prompt-wallets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    duplicateWallet: builder.mutation<PromptWallet, string>({
      query: (id) => ({ url: `/prompt-wallets/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    reorderWallets: builder.mutation<{ success: boolean }, string[]>({
      query: (orderedIds) => ({ url: '/prompt-wallets/reorder', method: 'POST', body: { orderedIds } }),
      invalidatesTags: ['PromptWallet'],
    }),

    restoreWallet: builder.mutation<PromptWallet, unknown>({
      query: (snapshot) => ({ url: '/prompt-wallets/restore', method: 'POST', body: snapshot }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    // ── Groups ────────────────────────────────────────────────────────
    createGroup: builder.mutation<PromptGroup, { walletId: string; title: string; description?: string }>({
      query: (body) => ({ url: '/prompt-groups', method: 'POST', body }),
      invalidatesTags: ['PromptGroup', 'PromptWallet'],
    }),

    updateGroup: builder.mutation<PromptGroup, { id: string; patch: Partial<Pick<PromptGroup, 'title' | 'description' | 'order' | 'lockLevel'>> }>({
      query: ({ id, patch }) => ({ url: `/prompt-groups/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['PromptGroup', 'PromptWallet'],
    }),

    deleteGroup: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/prompt-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    duplicateGroup: builder.mutation<PromptGroup, string>({
      query: (id) => ({ url: `/prompt-groups/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    reorderGroups: builder.mutation<{ success: boolean }, { walletId: string; orderedIds: string[] }>({
      query: (body) => ({ url: '/prompt-groups/reorder', method: 'POST', body }),
      invalidatesTags: ['PromptGroup', 'PromptWallet'],
    }),

    restoreGroup: builder.mutation<PromptGroup, unknown>({
      query: (snapshot) => ({ url: '/prompt-groups/restore', method: 'POST', body: snapshot }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    // ── Chunks ────────────────────────────────────────────────────────
    createChunk: builder.mutation<PromptChunk, { groupId: string; title: string; content: string }>({
      query: (body) => ({ url: '/prompt-chunks', method: 'POST', body }),
      invalidatesTags: ['PromptChunk', 'PromptGroup', 'PromptWallet'],
    }),

    updateChunk: builder.mutation<PromptChunk, { id: string; patch: Partial<Pick<PromptChunk, 'title' | 'content' | 'order' | 'lockLevel'>> }>({
      query: ({ id, patch }) => ({ url: `/prompt-chunks/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['PromptChunk', 'PromptWallet'],
    }),

    deleteChunk: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/prompt-chunks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    duplicateChunk: builder.mutation<PromptChunk, string>({
      query: (id) => ({ url: `/prompt-chunks/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    reorderChunks: builder.mutation<{ success: boolean }, { groupId: string; orderedIds: string[] }>({
      query: (body) => ({ url: '/prompt-chunks/reorder', method: 'POST', body }),
      invalidatesTags: ['PromptChunk', 'PromptWallet'],
    }),

    restoreChunk: builder.mutation<PromptChunk, unknown>({
      query: (snapshot) => ({ url: '/prompt-chunks/restore', method: 'POST', body: snapshot }),
      invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),

    // ── Wallet sharing ────────────────────────────────────────────────────
    shareWallet: builder.mutation<{ shareToken: string; shareUrl: string }, string>({
      query: (id) => ({ url: `/prompt-wallets/${id}/share`, method: 'POST' }),
      invalidatesTags: ['PromptWallet'],
    }),

    unshareWallet: builder.mutation<void, string>({
      query: (id) => ({ url: `/prompt-wallets/${id}/share`, method: 'DELETE' }),
      invalidatesTags: ['PromptWallet'],
    }),

    rotateShareToken: builder.mutation<{ shareToken: string; shareUrl: string }, string>({
      query: (id) => ({ url: `/prompt-wallets/${id}/share/rotate`, method: 'POST' }),
      invalidatesTags: ['PromptWallet'],
    }),
  }),
});

export const {
  useListWalletsQuery,
  useCreateWalletMutation,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
  useDuplicateWalletMutation,
  useReorderWalletsMutation,
  useRestoreWalletMutation,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useDuplicateGroupMutation,
  useReorderGroupsMutation,
  useRestoreGroupMutation,
  useCreateChunkMutation,
  useUpdateChunkMutation,
  useDeleteChunkMutation,
  useDuplicateChunkMutation,
  useReorderChunksMutation,
  useRestoreChunkMutation,
  useShareWalletMutation,
  useUnshareWalletMutation,
  useRotateShareTokenMutation,
} = promptsApi;
