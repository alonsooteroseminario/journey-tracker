import { prisma } from '@/lib/prisma';
import { canDelete, canEdit } from '@/lib/locks/lockGuards';

export class OwnershipError extends Error {
  status = 404;

  constructor(message = 'Not found') {
    super(message);
    this.name = 'OwnershipError';
  }
}

export class LockedError extends Error {
  status = 409;

  constructor(message = 'This item is locked') {
    super(message);
    this.name = 'LockedError';
  }
}

/**
 * Server-side enforcement of the lock levels the UI uses to disable buttons.
 *
 * The client disabling a button is not enforcement: a stale tab, a replayed
 * request, or a direct API call all bypass it. These guards read the level that
 * the ownership check already fetched, so they cost no extra query.
 *
 * `isLockChange` matters — a PATCH whose only job is to change `lockLevel` must
 * be allowed through even on a hard-locked item, otherwise locking something
 * hard would brick it permanently with no way back.
 */
export function assertCanEdit(lockLevel: string | null, isLockChange = false): void {
  if (isLockChange) return;
  if (!canEdit({ lockLevel: lockLevel as Parameters<typeof canEdit>[0]['lockLevel'] })) {
    throw new LockedError('This item is locked and cannot be edited');
  }
}

export function assertCanDelete(lockLevel: string | null): void {
  if (!canDelete({ lockLevel: lockLevel as Parameters<typeof canDelete>[0]['lockLevel'] })) {
    throw new LockedError('This item is locked and cannot be deleted');
  }
}

export async function assertWalletOwnership(
  walletId: string,
  userId: string,
): Promise<{ lockLevel: string | null }> {
  const wallet = await prisma.promptWallet.findFirst({
    where: { id: walletId, userId },
    select: { id: true, lockLevel: true },
  });
  if (!wallet) throw new OwnershipError();
  return { lockLevel: wallet.lockLevel ?? null };
}

export async function assertGroupOwnership(
  groupId: string,
  userId: string,
): Promise<{ lockLevel: string | null }> {
  const group = await prisma.promptGroup.findFirst({
    where: { id: groupId, wallet: { userId } },
    select: { id: true, lockLevel: true },
  });
  if (!group) throw new OwnershipError();
  return { lockLevel: group.lockLevel ?? null };
}

export async function assertChunkOwnership(
  chunkId: string,
  userId: string,
): Promise<{ lockLevel: string | null }> {
  const chunk = await prisma.promptChunk.findFirst({
    where: { id: chunkId, group: { wallet: { userId } } },
    select: { id: true, lockLevel: true },
  });
  if (!chunk) throw new OwnershipError();
  return { lockLevel: chunk.lockLevel ?? null };
}
