import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertChunkOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { serializePromptChunk } from '@/lib/prompts/walletApiShared';

// POST /api/prompt-chunks/[id]/duplicate
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertChunkOwnership(id, user.id);

    const created = await prisma.$transaction(async (tx) => {
      const source = await tx.promptChunk.findFirst({
        where: { id, group: { wallet: { userId: user.id } } },
      });

      if (!source) throw new OwnershipError();

      const last = await tx.promptChunk.findFirst({
        where: { groupId: source.groupId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = last ? last.order + 1 : 0;

      return tx.promptChunk.create({
        data: {
          groupId: source.groupId,
          title: `${source.title} (copy)`,
          content: source.content,
          order: nextOrder,
          lockLevel: null,
        },
      });
    });

    return NextResponse.json(serializePromptChunk(created), { status: 201 });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('POST /api/prompt-chunks/[id]/duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
