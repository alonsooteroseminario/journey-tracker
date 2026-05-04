import { prisma } from '@/lib/prisma';

export class OwnershipError extends Error {
  status = 404;

  constructor(message = 'Not found') {
    super(message);
    this.name = 'OwnershipError';
  }
}

export async function assertWalletOwnership(walletId: string, userId: string): Promise<void> {
  const wallet = await prisma.promptWallet.findFirst({
    where: { id: walletId, userId },
    select: { id: true },
  });
  if (!wallet) throw new OwnershipError();
}

export async function assertGroupOwnership(groupId: string, userId: string): Promise<void> {
  const group = await prisma.promptGroup.findFirst({
    where: { id: groupId, wallet: { userId } },
    select: { id: true },
  });
  if (!group) throw new OwnershipError();
}

export async function assertChunkOwnership(chunkId: string, userId: string): Promise<void> {
  const chunk = await prisma.promptChunk.findFirst({
    where: { id: chunkId, group: { wallet: { userId } } },
    select: { id: true },
  });
  if (!chunk) throw new OwnershipError();
}
