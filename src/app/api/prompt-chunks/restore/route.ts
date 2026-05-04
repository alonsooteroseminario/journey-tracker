import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  lockLevelToDb,
  serializePromptChunk,
  validateWalletTitle,
} from '@/lib/prompts/walletApiShared';

// POST /api/prompt-chunks/restore — recreate chunk from snapshot (undo)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.groupId || typeof body.groupId !== 'string') {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const titleErr = validateWalletTitle(body.title);
    if (titleErr) {
      return NextResponse.json({ error: titleErr }, { status: 400 });
    }

    if (typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
    }

    if (body.content.length > 100_000) {
      return NextResponse.json({ error: 'Chunk content is too large' }, { status: 400 });
    }

    let chunkLock: string | null;
    try {
      chunkLock = lockLevelToDb(body.lockLevel);
    } catch {
      return NextResponse.json({ error: 'Invalid lockLevel' }, { status: 400 });
    }

    // Verify parent group exists and is owned by user
    const group = await prisma.promptGroup.findFirst({
      where: { id: body.groupId, wallet: { userId: user.id } },
      select: { id: true },
    });
    if (!group) {
      return NextResponse.json({ error: 'Parent group missing' }, { status: 404 });
    }

    const last = await prisma.promptChunk.findFirst({
      where: { groupId: body.groupId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = last ? last.order + 1 : 0;

    const chunk = await prisma.promptChunk.create({
      data: {
        groupId: body.groupId,
        title: (body.title as string).trim(),
        content: body.content as string,
        order: nextOrder,
        lockLevel: chunkLock,
      },
    });

    return NextResponse.json(serializePromptChunk(chunk), { status: 201 });
  } catch (error) {
    console.error('POST /api/prompt-chunks/restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
