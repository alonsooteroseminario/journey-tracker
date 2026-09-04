import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertGroupOwnership: vi.fn() };
});

const created = new Date('2024-01-01T00:00:00.000Z');
const sourceGroup = {
  id: 'g1',
  walletId: 'w1',
  title: 'My Group',
  description: 'desc',
  order: 0,
  lockLevel: 'soft',
  createdAt: created,
  updatedAt: created,
  chunks: [
    { id: 'c1', groupId: 'g1', title: 'Chunk 1', content: 'hello', order: 0, lockLevel: null, createdAt: created, updatedAt: created },
    { id: 'c2', groupId: 'g1', title: 'Chunk 2', content: 'world', order: 1, lockLevel: 'hard', createdAt: created, updatedAt: created },
  ],
};

describe('POST /api/prompt-groups/[id]/duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertGroupOwnership).mockResolvedValue({ lockLevel: null });
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertGroupOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(404);
  });

  it('duplicates group with chunks, lockLevel null on copy', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst)
      .mockResolvedValueOnce(sourceGroup as never)
      .mockResolvedValueOnce({ order: 1 } as never);
    const dupGroup = {
      ...sourceGroup,
      id: 'g2',
      title: 'My Group (copy)',
      lockLevel: null,
      order: 2,
      chunks: sourceGroup.chunks.map((c) => ({ ...c, id: 'x', lockLevel: null })),
    };
    vi.mocked(prisma.promptGroup.create).mockResolvedValue(dupGroup as never);

    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('My Group (copy)');
    expect(j.lockLevel).toBeUndefined();
    expect(prisma.promptGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletId: 'w1',
          title: 'My Group (copy)',
          lockLevel: null,
          order: 2,
          chunks: {
            create: expect.arrayContaining([
              expect.objectContaining({ title: 'Chunk 1', content: 'hello', lockLevel: null }),
              expect.objectContaining({ title: 'Chunk 2', content: 'world', lockLevel: null }),
            ]),
          },
        }),
      })
    );
  });

  it('returns 404 when source not found in transaction', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockRejectedValue(new Error('db'));
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'g1' }) });
    expect(res.status).toBe(500);
  });
});
