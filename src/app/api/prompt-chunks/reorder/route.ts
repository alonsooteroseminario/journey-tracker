import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';

// POST /api/prompt-chunks/reorder — body { groupId, orderedIds }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, orderedIds } = body as { groupId?: unknown; orderedIds?: unknown };

    if (!groupId || typeof groupId !== 'string') {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 });
    }

    await assertGroupOwnership(groupId, user.id);

    const found = await prisma.promptChunk.findMany({
      where: { groupId },
      select: { id: true },
    });
    const ownedIds = new Set(found.map((c) => c.id));

    if (orderedIds.length !== ownedIds.size) {
      return NextResponse.json(
        { error: 'orderedIds must list each chunk exactly once' },
        { status: 400 }
      );
    }

    const seen = new Set<string>();
    for (const id of orderedIds) {
      if (typeof id !== 'string' || !ownedIds.has(id)) {
        return NextResponse.json(
          { error: 'orderedIds must list each chunk exactly once' },
          { status: 400 }
        );
      }
      if (seen.has(id)) {
        return NextResponse.json({ error: 'Duplicate id in orderedIds' }, { status: 400 });
      }
      seen.add(id);
    }

    if (ownedIds.size === 0) {
      return NextResponse.json({ success: true });
    }

    await prisma.$transaction(
      (orderedIds as string[]).map((id, i) =>
        prisma.promptChunk.update({ where: { id }, data: { order: i } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('POST /api/prompt-chunks/reorder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
