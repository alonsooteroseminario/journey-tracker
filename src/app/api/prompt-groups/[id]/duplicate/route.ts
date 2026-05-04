import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { serializePromptGroup } from '@/lib/prompts/walletApiShared';

const groupInclude = {
  chunks: { orderBy: { order: 'asc' as const } },
} as const;

// POST /api/prompt-groups/[id]/duplicate
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
    await assertGroupOwnership(id, user.id);

    const created = await prisma.$transaction(async (tx) => {
      const source = await tx.promptGroup.findFirst({
        where: { id, wallet: { userId: user.id } },
        include: { chunks: { orderBy: { order: 'asc' } } },
      });

      if (!source) throw new OwnershipError();

      const last = await tx.promptGroup.findFirst({
        where: { walletId: source.walletId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = last ? last.order + 1 : 0;

      return tx.promptGroup.create({
        data: {
          walletId: source.walletId,
          title: `${source.title} (copy)`,
          description: source.description,
          order: nextOrder,
          lockLevel: null,
          chunks: {
            create: source.chunks.map((c) => ({
              title: c.title,
              content: c.content,
              order: c.order,
              lockLevel: null,
            })),
          },
        },
        include: groupInclude,
      });
    });

    return NextResponse.json(serializePromptGroup(created), { status: 201 });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('POST /api/prompt-groups/[id]/duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
