import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  assertWalletOwnership,
  assertGroupOwnership,
  assertChunkOwnership,
  OwnershipError,
} from './ownership';

const mockWalletFindFirst = prisma.promptWallet.findFirst as ReturnType<typeof vi.fn>;
const mockGroupFindFirst = prisma.promptGroup.findFirst as ReturnType<typeof vi.fn>;
const mockChunkFindFirst = prisma.promptChunk.findFirst as ReturnType<typeof vi.fn>;

describe('assertWalletOwnership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when wallet exists for user', async () => {
    mockWalletFindFirst.mockResolvedValue({ id: 'w1' });
    await expect(assertWalletOwnership('w1', 'user-a')).resolves.toBeUndefined();
    expect(mockWalletFindFirst).toHaveBeenCalledWith({
      where: { id: 'w1', userId: 'user-a' },
      select: { id: true },
    });
  });

  it('throws OwnershipError with status 404 when wallet missing', async () => {
    mockWalletFindFirst.mockResolvedValue(null);
    await expect(assertWalletOwnership('missing', 'user-a')).rejects.toMatchObject({
      name: 'OwnershipError',
      status: 404,
    });
  });

  it('throws when wallet belongs to another user', async () => {
    mockWalletFindFirst.mockResolvedValue(null);
    await expect(assertWalletOwnership('w-owned-by-b', 'user-a')).rejects.toThrow(OwnershipError);
  });
});

describe('assertGroupOwnership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when group exists under user wallet', async () => {
    mockGroupFindFirst.mockResolvedValue({ id: 'g1' });
    await expect(assertGroupOwnership('g1', 'user-a')).resolves.toBeUndefined();
    expect(mockGroupFindFirst).toHaveBeenCalledWith({
      where: { id: 'g1', wallet: { userId: 'user-a' } },
      select: { id: true },
    });
  });

  it('throws OwnershipError when group not found', async () => {
    mockGroupFindFirst.mockResolvedValue(null);
    await expect(assertGroupOwnership('g-missing', 'user-a')).rejects.toThrow(OwnershipError);
  });

  it('throws when group wallet is owned by another user', async () => {
    mockGroupFindFirst.mockResolvedValue(null);
    await expect(assertGroupOwnership('g1', 'user-b')).rejects.toThrow(OwnershipError);
  });
});

describe('assertChunkOwnership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when chunk exists under user chain', async () => {
    mockChunkFindFirst.mockResolvedValue({ id: 'c1' });
    await expect(assertChunkOwnership('c1', 'user-a')).resolves.toBeUndefined();
    expect(mockChunkFindFirst).toHaveBeenCalledWith({
      where: { id: 'c1', group: { wallet: { userId: 'user-a' } } },
      select: { id: true },
    });
  });

  it('throws OwnershipError when chunk not found', async () => {
    mockChunkFindFirst.mockResolvedValue(null);
    await expect(assertChunkOwnership('c-missing', 'user-a')).rejects.toThrow(OwnershipError);
  });

  it('throws when chunk group belongs to another user wallet', async () => {
    mockChunkFindFirst.mockResolvedValue(null);
    await expect(assertChunkOwnership('c1', 'user-b')).rejects.toThrow(OwnershipError);
  });
});
