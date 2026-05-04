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

const created = new Date('2024-01-01T00:00:00.000Z');
const emptyChunk = {
  id: 'c1',
  groupId: 'g1',
  title: 'C',
  content: 'hello',
  order: 0,
  lockLevel: null,
  createdAt: created,
  updatedAt: created,
};

function req(body: unknown) {
  return new NextRequest('http://localhost/api/prompt-chunks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/prompt-chunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertGroupOwnership).mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x' }));
    expect(res.status).toBe(401);
    expect(prisma.promptChunk.create).not.toHaveBeenCalled();
  });

  it('returns 400 when groupId missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ title: 'C', content: 'x' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'groupId is required' });
  });

  it('returns 400 when title missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', content: 'x' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toContain('Title');
  });

  it('returns 400 when title too long', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'x'.repeat(201), content: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is not a string', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 123 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'content must be a string' });
  });

  it('returns 400 when content too large', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x'.repeat(100_001) }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when group ownership fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(assertGroupOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x' }));
    expect(res.status).toBe(404);
  });

  it('creates chunk with next order', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue({ order: 4 } as never);
    vi.mocked(prisma.promptChunk.create).mockResolvedValue({ ...emptyChunk, title: 'My Chunk', order: 5 } as never);
    const res = await POST(req({ groupId: 'g1', title: '  My Chunk  ', content: 'hello' }));
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe('My Chunk');
    expect(prisma.promptChunk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ groupId: 'g1', title: 'My Chunk', content: 'hello', order: 5, lockLevel: null }),
      })
    );
  });

  it('creates chunk with order 0 when group is empty', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptChunk.create).mockResolvedValue(emptyChunk as never);
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x' }));
    expect(res.status).toBe(201);
    expect(prisma.promptChunk.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 0 }) })
    );
  });

  it('returns 500 on db error', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);
    vi.mocked(prisma.promptChunk.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptChunk.create).mockRejectedValue(new Error('db'));
    const res = await POST(req({ groupId: 'g1', title: 'C', content: 'x' }));
    expect(res.status).toBe(500);
  });
});
