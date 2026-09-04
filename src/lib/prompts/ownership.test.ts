import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  assertWalletOwnership,
  assertGroupOwnership,
  assertChunkOwnership,
  OwnershipError,
  LockedError,
  assertCanEdit,
  assertCanDelete,
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
    await expect(assertWalletOwnership('w1', 'user-a')).resolves.toEqual({ lockLevel: null });
    expect(mockWalletFindFirst).toHaveBeenCalledWith({
      where: { id: 'w1', userId: 'user-a' },
      select: { id: true, lockLevel: true },
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
    await expect(assertGroupOwnership('g1', 'user-a')).resolves.toEqual({ lockLevel: null });
    expect(mockGroupFindFirst).toHaveBeenCalledWith({
      where: { id: 'g1', wallet: { userId: 'user-a' } },
      select: { id: true, lockLevel: true },
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
    await expect(assertChunkOwnership('c1', 'user-a')).resolves.toEqual({ lockLevel: null });
    expect(mockChunkFindFirst).toHaveBeenCalledWith({
      where: { id: 'c1', group: { wallet: { userId: 'user-a' } } },
      select: { id: true, lockLevel: true },
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

describe('lock enforcement', () => {
  describe('assertCanDelete', () => {
    it.each([[null], ['none']])('allows deleting an unlocked item (%s)', (level) => {
      expect(() => assertCanDelete(level)).not.toThrow();
    });

    // canDelete requires 'none' — a soft lock blocks deletion but not edits.
    it.each([['soft'], ['hard']])('blocks deleting a %s-locked item', (level) => {
      expect(() => assertCanDelete(level)).toThrow(LockedError);
    });

    it('reports 409, not 404 — the item exists, it is protected', () => {
      try {
        assertCanDelete('hard');
        throw new Error('should have thrown');
      } catch (e) {
        expect((e as LockedError).status).toBe(409);
      }
    });
  });

  describe('assertCanEdit', () => {
    it.each([[null], ['none'], ['soft']])('allows editing at lock level %s', (level) => {
      expect(() => assertCanEdit(level)).not.toThrow();
    });

    it('blocks editing a hard-locked item', () => {
      expect(() => assertCanEdit('hard')).toThrow(LockedError);
    });

    // Without this escape hatch, hard-locking an item would brick it forever:
    // the unlock request is itself an edit.
    it('still allows a pure lockLevel change on a hard-locked item', () => {
      expect(() => assertCanEdit('hard', true)).not.toThrow();
    });

    it('blocks a hard-locked edit that merely includes lockLevel alongside other fields', () => {
      expect(() => assertCanEdit('hard', false)).toThrow(LockedError);
    });
  });
});
