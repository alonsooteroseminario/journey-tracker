import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertWalletOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertWalletOwnership: vi.fn() };
});

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-groups/reorder', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/prompt-groups/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertWalletOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g1', 'g2'] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when walletId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ orderedIds: ['g1'] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'walletId is required' });
  });

  it('returns 400 when orderedIds not array', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: 'not-array' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when wallet ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertWalletOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g1'] }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when orderedIds has wrong count', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockResolvedValue([{ id: 'g1' }, { id: 'g2' }] as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g1'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderedIds has unknown id', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockResolvedValue([{ id: 'g1' }] as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g-unknown'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on duplicate id', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockResolvedValue([{ id: 'g1' }, { id: 'g2' }] as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g1', 'g1'] }));
    expect(res.status).toBe(400);
  });

  it('reorders groups and returns success', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockResolvedValue([{ id: 'g1' }, { id: 'g2' }] as never);
    vi.mocked(prisma.promptGroup.update).mockResolvedValue({} as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: ['g2', 'g1'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.promptGroup.update).toHaveBeenCalledWith({ where: { id: 'g2' }, data: { order: 0 } });
    expect(prisma.promptGroup.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { order: 1 } });
  });

  it('returns success immediately for empty wallet', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockResolvedValue([] as never);
    const res = await POST(req({ walletId: 'w1', orderedIds: [] }));
    expect(res.status).toBe(200);
    expect(prisma.promptGroup.update).not.toHaveBeenCalled();
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findMany).mockRejectedValue(new Error('db'));
    const res = await POST(req({ walletId: 'w1', orderedIds: [] }));
    expect(res.status).toBe(500);
  });
});
