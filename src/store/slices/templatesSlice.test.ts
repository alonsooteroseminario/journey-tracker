import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  templatesApi,
  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useForkTemplateMutation,
  useGetMarketplaceTemplatesQuery,
  useGetMarketplaceTemplateByIdQuery,
  usePublishTemplateMutation,
  useCreateForkRequestMutation,
  useGetForkRequestStatusQuery,
  useGetForkRequestsQuery,
  useRespondToForkRequestMutation,
} from './templatesSlice';

// Minimal response mock that satisfies RTK Query's fetchBaseQuery
const mockFetchResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: (_: string) => 'application/json' },
  text: async () => JSON.stringify(data),
  json: async () => data,
  clone: function (this: object) { return this; },
} as unknown as Response);

function makeStore() {
  return configureStore({
    reducer: { [templatesApi.reducerPath]: templatesApi.reducer },
    middleware: (gDM) =>
      gDM({ serializableCheck: false }).concat(templatesApi.middleware),
  });
}

/**
 * RTK Query's fetchBaseQuery calls `fetch(request)` with a Request object in happy-dom.
 * This helper extracts the URL from either a string or Request argument.
 */
function getLastFetchUrl(): string {
  const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  const arg = last?.[0];
  if (!arg) return '';
  if (typeof arg === 'string') return arg;
  // In happy-dom, RTK Query passes a Request object
  if (arg && typeof arg === 'object' && 'url' in arg) return String(arg.url);
  return '';
}

function getLastFetchMethod(): string {
  const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  const arg = last?.[0];
  if (!arg) return 'GET';
  if (typeof arg === 'object' && 'method' in arg) return String(arg.method);
  // Second arg may be RequestInit
  return String(last?.[1]?.method ?? 'GET');
}

describe('templatesApi slice', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse([]));
  });

  it('has reducerPath "templatesApi"', () => {
    expect(templatesApi.reducerPath).toBe('templatesApi');
  });

  it('has a reducer function', () => {
    expect(typeof templatesApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(typeof templatesApi.middleware).toBe('function');
  });

  it('exports all query hooks as functions', () => {
    expect(typeof useGetTemplatesQuery).toBe('function');
    expect(typeof useGetTemplateByIdQuery).toBe('function');
    expect(typeof useGetMarketplaceTemplatesQuery).toBe('function');
    expect(typeof useGetMarketplaceTemplateByIdQuery).toBe('function');
    expect(typeof useGetForkRequestStatusQuery).toBe('function');
    expect(typeof useGetForkRequestsQuery).toBe('function');
  });

  it('exports all mutation hooks as functions', () => {
    expect(typeof useCreateTemplateMutation).toBe('function');
    expect(typeof useUpdateTemplateMutation).toBe('function');
    expect(typeof useDeleteTemplateMutation).toBe('function');
    expect(typeof useForkTemplateMutation).toBe('function');
    expect(typeof usePublishTemplateMutation).toBe('function');
    expect(typeof useCreateForkRequestMutation).toBe('function');
    expect(typeof useRespondToForkRequestMutation).toBe('function');
  });

  it('has endpoints for all operations', () => {
    expect(templatesApi.endpoints.getTemplates).toBeDefined();
    expect(templatesApi.endpoints.getTemplateById).toBeDefined();
    expect(templatesApi.endpoints.createTemplate).toBeDefined();
    expect(templatesApi.endpoints.updateTemplate).toBeDefined();
    expect(templatesApi.endpoints.deleteTemplate).toBeDefined();
    expect(templatesApi.endpoints.forkTemplate).toBeDefined();
    expect(templatesApi.endpoints.getMarketplaceTemplates).toBeDefined();
    expect(templatesApi.endpoints.getMarketplaceTemplateById).toBeDefined();
    expect(templatesApi.endpoints.publishTemplate).toBeDefined();
    expect(templatesApi.endpoints.createForkRequest).toBeDefined();
    expect(templatesApi.endpoints.getForkRequestStatus).toBeDefined();
    expect(templatesApi.endpoints.getForkRequests).toBeDefined();
    expect(templatesApi.endpoints.respondToForkRequest).toBeDefined();
  });

  describe('query URL generation', () => {
    it('getTemplates calls fetch with correct URL and defaults', async () => {
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getTemplates.initiate({}));

      const url = getLastFetchUrl();
      expect(url).toContain('templates');
      expect(url).toContain('includeOwn=true');
      expect(url).toContain('visibility=all');
    });

    it('getTemplates uses custom options', async () => {
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.getTemplates.initiate({ includeOwn: false, visibility: 'public' })
      );

      const url = getLastFetchUrl();
      expect(url).toContain('includeOwn=false');
      expect(url).toContain('visibility=public');
    });

    it('getTemplateById calls fetch with id in URL', async () => {
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getTemplateById.initiate('tmpl-abc'));

      const url = getLastFetchUrl();
      expect(url).toContain('tmpl-abc');
    });

    it('getMarketplaceTemplates builds URL with all filters', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchResponse({ templates: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
      );
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.getMarketplaceTemplates.initiate({
          search: 'fitness',
          category: 'health',
          difficulty: 'beginner',
          page: 2,
          limit: 5,
        })
      );

      const url = getLastFetchUrl();
      expect(url).toContain('search=fitness');
      expect(url).toContain('category=health');
      expect(url).toContain('difficulty=beginner');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=5');
    });

    it('getMarketplaceTemplates with no filters builds base URL', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchResponse({ templates: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
      );
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getMarketplaceTemplates.initiate({}));

      const url = getLastFetchUrl();
      expect(url).toContain('marketplace');
    });

    it('getMarketplaceTemplateById calls fetch with id', async () => {
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getMarketplaceTemplateById.initiate('mkt-1'));

      const url = getLastFetchUrl();
      expect(url).toContain('mkt-1');
    });

    it('getForkRequestStatus calls fetch with templateId', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse(null));
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getForkRequestStatus.initiate('tmpl-xyz'));

      const url = getLastFetchUrl();
      expect(url).toContain('tmpl-xyz');
      expect(url).toContain('fork-request');
    });

    it('getForkRequests calls fetch for fork-requests list', async () => {
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.getForkRequests.initiate());

      const url = getLastFetchUrl();
      expect(url).toContain('fork-requests');
    });
  });

  describe('mutation request config', () => {
    it('createTemplate dispatches POST to /templates', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ id: 't1', title: 'Test' }));
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.createTemplate.initiate({
          goalId: 'g1',
          difficulty: 'beginner',
          visibility: 'public',
        })
      );

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('templates');
      expect(method).toBe('POST');
    });

    it('updateTemplate dispatches PATCH to /templates/:id', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ id: 't1' }));
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.updateTemplate.initiate({ id: 't1', data: { category: 'fitness' } })
      );

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('t1');
      expect(method).toBe('PATCH');
    });

    it('deleteTemplate dispatches DELETE to /templates/:id', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ success: true }));
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.deleteTemplate.initiate('t-del'));

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('t-del');
      expect(method).toBe('DELETE');
    });

    it('forkTemplate dispatches POST to /templates/:id/fork', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchResponse({ goalId: 'new-goal', title: 'Forked', taskCount: 3 })
      );
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.forkTemplate.initiate({ id: 't-fork', data: { customTitle: 'My Fork' } })
      );

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('fork');
      expect(method).toBe('POST');
    });

    it('publishTemplate dispatches POST to /marketplace/:id/publish', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ id: 't1', isPublished: true }));
      const store = makeStore();
      await store.dispatch(templatesApi.endpoints.publishTemplate.initiate('t-pub'));

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('publish');
      expect(method).toBe('POST');
    });

    it('createForkRequest dispatches POST with templateId in URL', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ id: 'fr-1' }));
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.createForkRequest.initiate({
          templateId: 'tmpl-1',
          message: 'Please share!',
        })
      );

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('tmpl-1');
      expect(method).toBe('POST');
    });

    it('respondToForkRequest dispatches PATCH to /fork-requests/:id', async () => {
      vi.mocked(global.fetch).mockResolvedValue(mockFetchResponse({ id: 'fr-1', status: 'approved' }));
      const store = makeStore();
      await store.dispatch(
        templatesApi.endpoints.respondToForkRequest.initiate({
          requestId: 'fr-1',
          status: 'approved',
        })
      );

      const url = getLastFetchUrl();
      const method = getLastFetchMethod();
      expect(url).toContain('fr-1');
      expect(method).toBe('PATCH');
    });
  });
});
