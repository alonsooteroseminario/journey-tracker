# Prompts Wallet — Step 4: RTK Query Slice + Compose Slice + `mergeChunks`

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Sections 3 + 4)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step4-store-and-merge`
> **Estimated session length:** medium (2–3h)
> **Depends on:** Steps 2 + 3 (API)
> **Unblocks:** Step 5 (leaf components consume hooks from this step)

---

## Goal

Wire the API into Redux so components can call generated hooks. Add the `composeSlice` for client-only Compose drawer state and the tiny `mergeChunks` helper.

---

## Files

```
src/store/slices/promptsSlice.ts          # RTK Query
src/store/slices/composeSlice.ts          # plain Redux slice
src/lib/prompts/mergeChunks.ts            # pure helper
+ co-located *.test.ts for each
```

Plus: register both slices in `src/store/index.ts` (or wherever the existing store config lives — match the pattern of `goalsSlice`).

---

## `promptsSlice.ts` (RTK Query)

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PromptWallet, PromptGroup, PromptChunk } from '@/types';

export const promptsApi = createApi({
  reducerPath: 'promptsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
  endpoints: (builder) => ({
    listWallets: builder.query<PromptWallet[], void>({
      query: () => '/prompt-wallets',
      providesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'],
    }),
    createWallet: builder.mutation<PromptWallet, { title: string; icon?: string; description?: string }>({
      query: (body) => ({ url: '/prompt-wallets', method: 'POST', body }),
      invalidatesTags: ['PromptWallet'],
    }),
    updateWallet: builder.mutation<PromptWallet, { id: string; patch: Partial<PromptWallet> }>({ /* PATCH */ invalidatesTags: ['PromptWallet'] }),
    deleteWallet: builder.mutation<void, string>({ /* DELETE */ invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'] }),
    duplicateWallet: builder.mutation<PromptWallet, string>({ /* POST /duplicate */ invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'] }),
    reorderWallets: builder.mutation<void, string[]>({ /* POST /reorder */ invalidatesTags: ['PromptWallet'] }),
    restoreWallet: builder.mutation<PromptWallet, /* snapshot */ unknown>({ /* POST /restore */ invalidatesTags: ['PromptWallet', 'PromptGroup', 'PromptChunk'] }),

    // ... mirror for groups and chunks ...
  }),
});

export const {
  useListWalletsQuery,
  useCreateWalletMutation,
  useUpdateWalletMutation,
  // etc...
} = promptsApi;
```

**Tag invalidation rules:**
- `listWallets` provides all three tags (single endpoint, single fetch).
- Wallet mutations invalidate `PromptWallet`.
- Group mutations invalidate `PromptGroup`.
- Chunk mutations invalidate `PromptChunk`.
- Delete + duplicate + restore at any level invalidate all three (cascade).

---

## `composeSlice.ts` (plain Redux)

State shape:
```ts
interface ComposeChunkRef {
  chunkId: string;     // PromptChunk.id
  sessionOrder: number;
  included: boolean;   // checkbox state
}

interface ComposeState {
  refs: ComposeChunkRef[];
}
```

Actions:
- `addChunk(chunkId)` — appends, default `included: true`. Idempotent (no-op if already present).
- `removeChunk(chunkId)` — removes one ref.
- `toggleChunk(chunkId)` — flips `included`.
- `reorderChunks(orderedChunkIds: string[])` — re-numbers `sessionOrder`.
- `replaceWithGroup(chunkIds: string[])` — clear + add all (used by Group-as-recipe click).
- `appendGroup(chunkIds: string[])` — append (used when "Append" chosen on the Replace/Append/Cancel dialog).
- `clearCompose()`.

Selectors:
- `selectComposeRefs(state)`.
- `selectComposedChunks(state)` — joins refs with the RTK Query cache; returns ordered, `included`-filtered chunks.

---

## `mergeChunks.ts`

```ts
import type { PromptChunk } from '@/types';

const SEPARATOR = '\n\n';

export function mergeChunks(chunks: PromptChunk[]): string {
  return chunks.map((c) => c.content).join(SEPARATOR);
}
```

Tests:
- empty array → `''`
- single → `chunk.content`
- two → joined with `\n\n`
- preserves chunk order
- ignores extra fields

---

## Steps

1. Read existing `src/store/slices/goalsSlice.ts` for RTK Query patterns.
2. Read `src/store/slices/uiSlice.ts` for plain-slice pattern.
3. Implement `mergeChunks.ts` + test (smallest piece, gets you a green test fast).
4. Implement `composeSlice.ts` + test (covers every action and the joined selector).
5. Implement `promptsSlice.ts`. Aim for a single file, ~120 lines.
6. Register both reducers in the store.
7. **`promptsSlice.test.ts`** — verify cache tag invalidation is correct using `setupApiStore` helper or a simple `dispatch + getState` pattern.
8. `npm run lint` + `npm run test`.
9. Commit `feat(prompts-wallet/step4): RTK Query + composeSlice + mergeChunks`.

---

## Verification Checklist

- [ ] `useListWalletsQuery`, `useCreateChunkMutation`, etc. all exported and typed
- [ ] `composeSlice` handles all 7 actions correctly
- [ ] `mergeChunks` test cases all pass
- [ ] `promptsApi.middleware` registered in store
- [ ] `promptsApi.reducerPath` reducer added in store
- [ ] No type errors anywhere in the project (`npm run build`)
- [ ] Coverage holds ≥80%

## Out of Scope

- Components (Steps 5–7)
- Compose persistence (Phase 2)

## Tracker

Tick row #4 → ✅ Done.
