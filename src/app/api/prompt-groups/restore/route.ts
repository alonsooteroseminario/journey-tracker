import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  lockLevelToDb,
  serializePromptGroup,
  validateWalletTitle,
  validateOptionalDescription,
} from '@/lib/prompts/walletApiShared';

const groupInclude = {
  chunks: { orderBy: { order: 'asc' as const } },
} as const;

function validateRestoreChunk(c: unknown): string | null {
  if (!c || typeof c !== 'object') return 'Each chunk must be an object';
  const o = c as Record<string, unknown>;
  const titleErr = validateWalletTitle(o.title);
  if (titleErr) return `Chunk title: ${titleErr}`;
  if (typeof o.content !== 'string') return 'Chunk content must be a string';
  if (o.content.length > 100_000) return 'Chunk content is too large';
  return null;
}

// POST /api/prompt-groups/restore — recreate group + chunks from snapshot (undo)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.walletId || typeof body.walletId !== 'string') {
      return NextResponse.json({ error: 'walletId is required' }, { status: 400 });
    }

    const titleErr = validateWalletTitle(body.title);
    if (titleErr) {
      return NextResponse.json({ error: titleErr }, { status: 400 });
    }

    const descErr = validateOptionalDescription(body.description);
    if (descErr) {
      return NextResponse.json({ error: descErr }, { status: 400 });
    }

    if (!Array.isArray(body.chunks)) {
      return NextResponse.json({ error: 'chunks must be an array' }, { status: 400 });
    }

    for (const c of body.chunks) {
      const err = validateRestoreChunk(c);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
    }

    let groupLock: string | null;
    try {
      groupLock = lockLevelToDb(body.lockLevel);
    } catch {
      return NextResponse.json({ error: 'Invalid lockLevel' }, { status: 400 });
    }

    const wallet = await prisma.promptWallet.findFirst({
      where: { id: body.walletId, userId: user.id },
      select: { id: true },
    });
    if (!wallet) {
      return NextResponse.json({ error: 'Parent wallet missing' }, { status: 404 });
    }

    const last = await prisma.promptGroup.findFirst({
      where: { walletId: body.walletId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = last ? last.order + 1 : 0;

    const group = await prisma.promptGroup.create({
      data: {
        walletId: body.walletId,
        title: (body.title as string).trim(),
        description:
          typeof body.description === 'string' && body.description.trim().length > 0
            ? body.description.trim()
            : null,
        order: nextOrder,
        lockLevel: groupLock,
        chunks: {
          create: (body.chunks as Record<string, unknown>[]).map((c, i) => {
            let chunkLock: string | null;
            try {
              chunkLock = lockLevelToDb(c.lockLevel);
            } catch {
              throw new Error('INVALID_CHUNK_LOCK');
            }
            return {
              title: (c.title as string).trim(),
              content: c.content as string,
              order: i,
              lockLevel: chunkLock,
            };
          }),
        },
      },
      include: groupInclude,
    });

    return NextResponse.json(serializePromptGroup(group), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CHUNK_LOCK') {
      return NextResponse.json({ error: 'Invalid lockLevel' }, { status: 400 });
    }
    console.error('POST /api/prompt-groups/restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
