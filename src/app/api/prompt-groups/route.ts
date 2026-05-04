import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertWalletOwnership, OwnershipError } from '@/lib/prompts/ownership';
import {
  serializePromptGroup,
  validateWalletTitle,
  validateOptionalDescription,
} from '@/lib/prompts/walletApiShared';

const groupInclude = {
  chunks: { orderBy: { order: 'asc' as const } },
} as const;

// POST /api/prompt-groups — create group
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

    await assertWalletOwnership(body.walletId, user.id);

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
        lockLevel: null,
      },
      include: groupInclude,
    });

    return NextResponse.json(serializePromptGroup(group), { status: 201 });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('POST /api/prompt-groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
