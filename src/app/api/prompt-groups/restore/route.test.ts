import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

const created = new Date('2024-01-01T00:00:00.000Z');

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-groups/restore', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validBody = {
  walletId: 'w1',
  title: 'Restored Group',
  lockLevel: null,
  chunks: [
    { title: 'Chunk A', content: 'hello', lockLevel: null },
    { title: 'Chunk B', content: 'world', lockLevel: 'soft' },
  ],
};

const createdGroup = {
  id: 'g-new',
  walletId: 'w1',
  title: 'Restored Group',
  description: null,
  order: 1,
  lockLevel: null,
  createdAt: created,
  updatedAt: created,
  chunks: [
    { id: 'c1', groupId: 'g-new', title: 'Chunk A', content: 'hello', order: 0, lockLevel: null, createdAt: created, updatedAt: created },
    { id: 'c2', groupId: 'g-new', title: 'Chunk B', content: 'world', order: 1, lockLevel: 'soft', createdAt: created, updatedAt: created },
  ],
};

describe('POST /api/prompt-groups/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(401);
    expect(prisma.promptGroup.create).not.toHaveBeenCalled();
  });

  it('returns 400 when walletId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ title: 'G', lockLevel: null, chunks: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'walletId is required' });
  });

  it('returns 400 when title missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', lockLevel: null, chunks: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when chunks not array', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', title: 'G', lockLevel: null, chunks: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when a chunk is invalid', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({
      walletId: 'w1', title: 'G', lockLevel: null,
      chunks: [{ title: '', content: 'x' }],
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when chunk content is not a string', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({
      walletId: 'w1', title: 'G', lockLevel: null,
      chunks: [{ title: 'T', content: 123 }],
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when lockLevel is invalid', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ walletId: 'w1', title: 'G', lockLevel: 'bad', chunks: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when parent wallet missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'Parent wallet missing' });
  });

  it('creates group + chunks and returns 201', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue({ id: 'w1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue({ order: 0 } as never);
    vi.mocked(prisma.promptGroup.create).mockResolvedValue(createdGroup as never);

    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('Restored Group');
    expect(j.chunks).toHaveLength(2);
    expect(prisma.promptGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletId: 'w1',
          title: 'Restored Group',
          order: 1,
          lockLevel: null,
          chunks: {
            create: expect.arrayContaining([
              expect.objectContaining({ title: 'Chunk A', content: 'hello', lockLevel: null }),
              expect.objectContaining({ title: 'Chunk B', content: 'world', lockLevel: 'soft' }),
            ]),
          },
        }),
      })
    );
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue({ id: 'w1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptGroup.create).mockRejectedValue(new Error('db'));
    const res = await POST(req(validBody));
    expect(res.status).toBe(500);
  });
});
