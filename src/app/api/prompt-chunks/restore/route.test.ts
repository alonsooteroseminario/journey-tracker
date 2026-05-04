import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

const created = new Date('2024-01-01T00:00:00.000Z');

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-chunks/restore', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validBody = {
  groupId: 'g1',
  title: 'Restored Chunk',
  content: 'the content',
  lockLevel: 'soft',
};

const createdChunk = {
  id: 'c-new',
  groupId: 'g1',
  title: 'Restored Chunk',
  content: 'the content',
  order: 2,
  lockLevel: 'soft',
  createdAt: created,
  updatedAt: created,
};

describe('POST /api/prompt-chunks/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(401);
    expect(prisma.promptChunk.create).not.toHaveBeenCalled();
  });

  it('returns 400 when groupId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ title: 'C', content: 'x', lockLevel: null }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'groupId is required' });
  });

  it('returns 400 when title missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', content: 'x', lockLevel: null }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is not a string', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 999, lockLevel: null }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'content must be a string' });
  });

  it('returns 400 when content too large', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x'.repeat(100_001), lockLevel: null }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when lockLevel is invalid', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x', lockLevel: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when parent group missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'Parent group missing' });
  });

  it('creates chunk and returns 201', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue({ id: 'g1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue({ order: 1 } as never);
    vi.mocked(prisma.promptChunk.create).mockResolvedValue(createdChunk as never);

    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('Restored Chunk');
    expect(j.lockLevel).toBe('soft');
    expect(prisma.promptChunk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'g1',
          title: 'Restored Chunk',
          content: 'the content',
          order: 2,
          lockLevel: 'soft',
        }),
      })
    );
  });

  it('creates chunk with order 0 when group is empty', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue({ id: 'g1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptChunk.create).mockResolvedValue({ ...createdChunk, order: 0 } as never);
    const res = await POST(req({ ...validBody, lockLevel: null }));
    expect(res.status).toBe(201);
    expect(prisma.promptChunk.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 0 }) })
    );
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptGroup.findFirst).mockResolvedValue({ id: 'g1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptChunk.create).mockRejectedValue(new Error('db'));
    const res = await POST(req(validBody));
    expect(res.status).toBe(500);
  });
});
