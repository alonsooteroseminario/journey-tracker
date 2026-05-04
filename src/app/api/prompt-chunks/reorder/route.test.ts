import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertGroupOwnership: vi.fn() };
});

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-chunks/reorder', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/prompt-chunks/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertGroupOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c1', 'c2'] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when groupId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ orderedIds: ['c1'] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'groupId is required' });
  });

  it('returns 400 when orderedIds not array', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when group ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertGroupOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c1'] }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when orderedIds has wrong count', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }] as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c1'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderedIds has unknown id', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockResolvedValue([{ id: 'c1' }] as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c-unknown'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on duplicate id', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }] as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c1', 'c1'] }));
    expect(res.status).toBe(400);
  });

  it('reorders chunks and returns success', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }] as never);
    vi.mocked(prisma.promptChunk.update).mockResolvedValue({} as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: ['c2', 'c1'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.promptChunk.update).toHaveBeenCalledWith({ where: { id: 'c2' }, data: { order: 0 } });
    expect(prisma.promptChunk.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { order: 1 } });
  });

  it('returns success immediately for empty group', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockResolvedValue([] as never);
    const res = await POST(req({ groupId: 'g1', orderedIds: [] }));
    expect(res.status).toBe(200);
    expect(prisma.promptChunk.update).not.toHaveBeenCalled();
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findMany).mockRejectedValue(new Error('db'));
    const res = await POST(req({ groupId: 'g1', orderedIds: [] }));
    expect(res.status).toBe(500);
  });
});
