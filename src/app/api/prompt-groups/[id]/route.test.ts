import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertGroupOwnership: vi.fn() };
});

const created = new Date('2024-01-01T00:00:00.000Z');
const emptyGroup = {
  id: 'g1',
  walletId: 'w1',
  title: 'G',
  description: null,
  order: 0,
  lockLevel: null,
  createdAt: created,
  updatedAt: created,
  chunks: [],
};

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-groups/g1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/prompt-groups/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertGroupOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PATCH(patchReq({ title: 'X' }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(401);
    expect(prisma.promptGroup.update).not.toHaveBeenCalled();
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertGroupOwnership).mockRejectedValue(new OwnershipError());
    const res = await PATCH(patchReq({ title: 'X' }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no valid fields', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({}), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'No valid fields to update' });
  });

  it('returns 400 for invalid lockLevel', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ lockLevel: 'nope' }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer order', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await PATCH(patchReq({ order: 1.5 }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(400);
  });

  it('updates title and sets lock to null when none', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.update).mockResolvedValue({ ...emptyGroup, title: 'Renamed' } as never);
    const res = await PATCH(patchReq({ title: 'Renamed', lockLevel: 'none' }), {
      params: Promise.resolve({ id: 'g1' }),
    });
    expect(res.status).toBe(200);
    expect(prisma.promptGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: expect.objectContaining({ title: 'Renamed', lockLevel: null }),
      })
    );
  });

  it('updates description to null when null passed', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.update).mockResolvedValue(emptyGroup as never);
    const res = await PATCH(patchReq({ description: null }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(200);
    expect(prisma.promptGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    );
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.update).mockRejectedValue(new Error('db'));
    const res = await PATCH(patchReq({ title: 'X' }), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/prompt-groups/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertGroupOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/prompt-groups/g1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(401);
    expect(prisma.promptGroup.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertGroupOwnership).mockRejectedValue(new OwnershipError());
    const req = new NextRequest('http://localhost/api/prompt-groups/g1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(404);
  });

  it('deletes group and returns success', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.delete).mockResolvedValue({} as never);
    const req = new NextRequest('http://localhost/api/prompt-groups/g1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.promptGroup.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.delete).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/prompt-groups/g1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(500);
  });
});
