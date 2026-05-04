import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  promptsApi,
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
} from './promptsSlice';

const mockFetchResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    headers: { get: (_: string) => 'application/json' },
    text: async () => JSON.stringify(data),
    json: async () => data,
    clone: function (this: object) { return this; },
  } as unknown as Response);

function makeStore() {
  return configureStore({
    reducer: { [promptsApi.reducerPath]: promptsApi.reducer },
    middleware: (gDM) =>
      gDM({ serializableCheck: false }).concat(promptsApi.middleware),
  });
}

function getLastFetchUrl(): string {
  const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  const arg = last?.[0];
  if (!arg) return '';
  if (typeof arg === 'string') return arg;
  if (arg && typeof arg === 'object' && 'url' in arg) return String(arg.url);
  return '';
}

function getLastFetchMethod(): string {
  const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  const arg = last?.[0];
  if (arg && typeof arg === 'object' && 'method' in arg) return String(arg.method);
  return String(last?.[1]?.method ?? 'GET');
}

describe('promptsApi slice', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse([]));
  });

  it('has reducerPath "promptsApi"', () => {
    expect(promptsApi.reducerPath).toBe('promptsApi');
  });

  it('has a reducer function', () => {
    expect(typeof promptsApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(typeof promptsApi.middleware).toBe('function');
  });

  it('exports all query hooks as functions', () => {
    expect(typeof useListWalletsQuery).toBe('function');
  });

  it('exports all wallet mutation hooks as functions', () => {
    expect(typeof useCreateWalletMutation).toBe('function');
    expect(typeof useUpdateWalletMutation).toBe('function');
    expect(typeof useDeleteWalletMutation).toBe('function');
    expect(typeof useDuplicateWalletMutation).toBe('function');
    expect(typeof useReorderWalletsMutation).toBe('function');
    expect(typeof useRestoreWalletMutation).toBe('function');
  });

  it('exports all group mutation hooks as functions', () => {
    expect(typeof useCreateGroupMutation).toBe('function');
    expect(typeof useUpdateGroupMutation).toBe('function');
    expect(typeof useDeleteGroupMutation).toBe('function');
    expect(typeof useDuplicateGroupMutation).toBe('function');
    expect(typeof useReorderGroupsMutation).toBe('function');
    expect(typeof useRestoreGroupMutation).toBe('function');
  });

  it('exports all chunk mutation hooks as functions', () => {
    expect(typeof useCreateChunkMutation).toBe('function');
    expect(typeof useUpdateChunkMutation).toBe('function');
    expect(typeof useDeleteChunkMutation).toBe('function');
    expect(typeof useDuplicateChunkMutation).toBe('function');
    expect(typeof useReorderChunksMutation).toBe('function');
    expect(typeof useRestoreChunkMutation).toBe('function');
  });

  it('has all expected endpoints defined', () => {
    expect(promptsApi.endpoints.listWallets).toBeDefined();
    expect(promptsApi.endpoints.createWallet).toBeDefined();
    expect(promptsApi.endpoints.updateWallet).toBeDefined();
    expect(promptsApi.endpoints.deleteWallet).toBeDefined();
    expect(promptsApi.endpoints.duplicateWallet).toBeDefined();
    expect(promptsApi.endpoints.reorderWallets).toBeDefined();
    expect(promptsApi.endpoints.restoreWallet).toBeDefined();
    expect(promptsApi.endpoints.createGroup).toBeDefined();
    expect(promptsApi.endpoints.updateGroup).toBeDefined();
    expect(promptsApi.endpoints.deleteGroup).toBeDefined();
    expect(promptsApi.endpoints.duplicateGroup).toBeDefined();
    expect(promptsApi.endpoints.reorderGroups).toBeDefined();
    expect(promptsApi.endpoints.restoreGroup).toBeDefined();
    expect(promptsApi.endpoints.createChunk).toBeDefined();
    expect(promptsApi.endpoints.updateChunk).toBeDefined();
    expect(promptsApi.endpoints.deleteChunk).toBeDefined();
    expect(promptsApi.endpoints.duplicateChunk).toBeDefined();
    expect(promptsApi.endpoints.reorderChunks).toBeDefined();
    expect(promptsApi.endpoints.restoreChunk).toBeDefined();
  });

  describe('URL and method generation', () => {
    it('listWallets calls GET /prompt-wallets', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.listWallets.initiate());
      expect(getLastFetchUrl()).toContain('prompt-wallets');
      expect(getLastFetchMethod()).toBe('GET');
    });

    it('createWallet calls POST /prompt-wallets', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.createWallet.initiate({ title: 'T' }));
      expect(getLastFetchUrl()).toContain('prompt-wallets');
      expect(getLastFetchMethod()).toBe('POST');
    });

    it('updateWallet calls PATCH /prompt-wallets/:id', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.updateWallet.initiate({ id: 'w1', patch: { title: 'X' } }));
      expect(getLastFetchUrl()).toContain('prompt-wallets/w1');
      expect(getLastFetchMethod()).toBe('PATCH');
    });

    it('deleteWallet calls DELETE /prompt-wallets/:id', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.deleteWallet.initiate('w1'));
      expect(getLastFetchUrl()).toContain('prompt-wallets/w1');
      expect(getLastFetchMethod()).toBe('DELETE');
    });

    it('duplicateWallet calls POST /prompt-wallets/:id/duplicate', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.duplicateWallet.initiate('w1'));
      expect(getLastFetchUrl()).toContain('prompt-wallets/w1/duplicate');
      expect(getLastFetchMethod()).toBe('POST');
    });

    it('createGroup calls POST /prompt-groups', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.createGroup.initiate({ walletId: 'w1', title: 'G' }));
      expect(getLastFetchUrl()).toContain('prompt-groups');
      expect(getLastFetchMethod()).toBe('POST');
    });

    it('updateChunk calls PATCH /prompt-chunks/:id', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.updateChunk.initiate({ id: 'c1', patch: { content: 'x' } }));
      expect(getLastFetchUrl()).toContain('prompt-chunks/c1');
      expect(getLastFetchMethod()).toBe('PATCH');
    });

    it('deleteChunk calls DELETE /prompt-chunks/:id', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.deleteChunk.initiate('c1'));
      expect(getLastFetchUrl()).toContain('prompt-chunks/c1');
      expect(getLastFetchMethod()).toBe('DELETE');
    });

    it('reorderGroups calls POST /prompt-groups/reorder', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.reorderGroups.initiate({ walletId: 'w1', orderedIds: ['g1'] }));
      expect(getLastFetchUrl()).toContain('prompt-groups/reorder');
      expect(getLastFetchMethod()).toBe('POST');
    });

    it('restoreChunk calls POST /prompt-chunks/restore', async () => {
      const store = makeStore();
      await store.dispatch(promptsApi.endpoints.restoreChunk.initiate({}));
      expect(getLastFetchUrl()).toContain('prompt-chunks/restore');
      expect(getLastFetchMethod()).toBe('POST');
    });
  });
});
