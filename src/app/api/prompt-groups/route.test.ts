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

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-groups', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/prompt-groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertWalletOwnership).mockResolvedValue({ lockLevel: null });
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req({ walletId: 'w1', title: 'G' }));
    expect(res.status).toBe(401);
    expect(prisma.promptGroup.create).not.toHaveBeenCalled();
  });

  it('returns 400 when walletId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ title: 'G' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'walletId is required' });
  });

  it('returns 400 when title missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toContain('Title');
  });

  it('returns 400 when title too long', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', title: 'x'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when description invalid type', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', title: 'G', description: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when wallet ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertWalletOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(req({ walletId: 'w1', title: 'G' }));
    expect(res.status).toBe(404);
  });

  it('creates group with next order', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue({ order: 2 } as never);
    vi.mocked(prisma.promptGroup.create).mockResolvedValue({ ...emptyGroup, title: 'My Group', order: 3 } as never);
    const res = await POST(req({ walletId: 'w1', title: '  My Group  ' }));
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('My Group');
    expect(prisma.promptGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'My Group', walletId: 'w1', order: 3, lockLevel: null }),
      })
    );
  });

  it('creates group with order 0 when no existing groups', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptGroup.create).mockResolvedValue({ ...emptyGroup, order: 0 } as never);
    const res = await POST(req({ walletId: 'w1', title: 'First' }));
    expect(res.status).toBe(201);
    expect(prisma.promptGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: 0 }),
      })
    );
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptGroup.create).mockRejectedValue(new Error('db'));
    const res = await POST(req({ walletId: 'w1', title: 'G' }));
    expect(res.status).toBe(500);
  });
});
