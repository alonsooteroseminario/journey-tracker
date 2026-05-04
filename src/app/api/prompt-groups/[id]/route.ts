import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertGroupOwnership, OwnershipError } from '@/lib/prompts/ownership';
import {
  serializePromptGroup,
  validateWalletTitle,
  validateOptionalDescription,
  lockLevelToDb,
} from '@/lib/prompts/walletApiShared';

const groupInclude = {
  chunks: { orderBy: { order: 'asc' as const } },
} as const;

// PATCH /api/prompt-groups/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertGroupOwnership(id, user.id);

    const body = await req.json();
    const data: Prisma.PromptGroupUpdateInput = {};

    if (body.title !== undefined) {
      const err = validateWalletTitle(body.title);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      data.title = (body.title as string).trim();
    }

    if (body.description !== undefined) {
      const err = validateOptionalDescription(body.description);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      if (body.description === null) {
        data.description = null;
      } else if (typeof body.description === 'string') {
        const t = body.description.trim();
        data.description = t.length > 0 ? t : null;
      }
    }

    if (body.order !== undefined) {
      if (typeof body.order !== 'number' || !Number.isInteger(body.order)) {
        return NextResponse.json({ error: 'order must be an integer' }, { status: 400 });
      }
      data.order = body.order;
    }

    if (body.lockLevel !== undefined) {
      try {
        data.lockLevel = lockLevelToDb(body.lockLevel);
      } catch {
        return NextResponse.json({ error: 'Invalid lockLevel' }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const group = await prisma.promptGroup.update({
      where: { id },
      data,
      include: groupInclude,
    });

    return NextResponse.json(serializePromptGroup(group));
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('PATCH /api/prompt-groups/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/prompt-groups/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertGroupOwnership(id, user.id);

    await prisma.promptGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('DELETE /api/prompt-groups/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
