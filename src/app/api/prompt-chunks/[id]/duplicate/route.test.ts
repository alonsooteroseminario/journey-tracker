import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertChunkOwnership, OwnershipError } from '@/lib/prompts/ownership';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/prompts/ownership', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/prompts/ownership')>();
  return { ...mod, assertChunkOwnership: vi.fn() };
});

const created = new Date('2024-01-01T00:00:00.000Z');
const sourceChunk = {
  id: 'c1',
  groupId: 'g1',
  title: 'My Chunk',
  content: 'some text here',
  order: 2,
  lockLevel: 'hard',
  createdAt: created,
  updatedAt: created,
};

describe('POST /api/prompt-chunks/[id]/duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertChunkOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertChunkOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('duplicates chunk with lockLevel null and appended order', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst)
      .mockResolvedValueOnce(sourceChunk as never)
      .mockResolvedValueOnce({ order: 3 } as never);
    const dupChunk = { ...sourceChunk, id: 'c2', title: 'My Chunk (copy)', lockLevel: null, order: 4 };
    vi.mocked(prisma.promptChunk.create).mockResolvedValue(dupChunk as never);

    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('My Chunk (copy)');
    expect(j.lockLevel).toBeUndefined();
    expect(prisma.promptChunk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'g1',
          title: 'My Chunk (copy)',
          content: 'some text here',
          order: 4,
          lockLevel: null,
        }),
      })
    );
  });

  it('returns 404 when source not found in transaction', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue(null);
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockRejectedValue(new Error('db'));
    const res = await POST(new Request('http://localhost'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(500);
  });
});
