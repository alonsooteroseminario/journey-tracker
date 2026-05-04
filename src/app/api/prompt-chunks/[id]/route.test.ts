import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertChunkOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertChunkOwnership: vi.fn() };
});

const created = new Date('2024-01-01T00:00:00.000Z');
const chunk = {
  id: 'c1',
  groupId: 'g1',
  title: 'C',
  content: 'hello',
  order: 0,
  lockLevel: null,
  createdAt: created,
  updatedAt: created,
};

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-chunks/c1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/prompt-chunks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertChunkOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PATCH(patchReq({ content: 'x' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
    expect(prisma.promptChunk.update).not.toHaveBeenCalled();
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertChunkOwnership).mockRejectedValue(new OwnershipError());
    const res = await PATCH(patchReq({ content: 'x' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no valid fields', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({}), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'No valid fields to update' });
  });

  it('returns 400 for invalid lockLevel', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ lockLevel: 'nope' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer order', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ order: 2.5 }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is not a string', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ content: 42 }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when content too large', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ content: 'x'.repeat(100_001) }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('updates content and sets lock', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.update).mockResolvedValue({ ...chunk, content: 'updated', lockLevel: 'soft' } as never);
    const res = await PATCH(patchReq({ content: 'updated', lockLevel: 'soft' }), {
      params: Promise.resolve({ id: 'c1' }),
    });
    expect(res.status).toBe(200);
    expect(prisma.promptChunk.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { content: 'updated', lockLevel: 'soft' },
    });
  });

  it('updates only title (auto-save partial)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.update).mockResolvedValue({ ...chunk, title: 'New Title' } as never);
    const res = await PATCH(patchReq({ title: 'New Title' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(200);
    expect(prisma.promptChunk.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { title: 'New Title' },
    });
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.update).mockRejectedValue(new Error('db'));
    const res = await PATCH(patchReq({ content: 'x' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/prompt-chunks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertChunkOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/prompt-chunks/c1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
    expect(prisma.promptChunk.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertChunkOwnership).mockRejectedValue(new OwnershipError());
    const req = new NextRequest('http://localhost/api/prompt-chunks/c1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('deletes chunk and returns success', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.delete).mockResolvedValue({} as never);
    const req = new NextRequest('http://localhost/api/prompt-chunks/c1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.promptChunk.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.delete).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/prompt-chunks/c1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(500);
  });
});
