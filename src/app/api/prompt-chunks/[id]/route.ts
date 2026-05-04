import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertChunkOwnership, OwnershipError } from '@/lib/prompts/ownership';
import {
  serializePromptChunk,
  validateWalletTitle,
  lockLevelToDb,
} from '@/lib/prompts/walletApiShared';

// PATCH /api/prompt-chunks/[id] — auto-save target; only updates fields present in body
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
    await assertChunkOwnership(id, user.id);

    const body = await req.json();
    const data: Prisma.PromptChunkUpdateInput = {};

    if (body.title !== undefined) {
      const err = validateWalletTitle(body.title);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      data.title = (body.title as string).trim();
    }

    if (body.content !== undefined) {
      if (typeof body.content !== 'string') {
        return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
      }
      if (body.content.length > 100_000) {
        return NextResponse.json({ error: 'Chunk content is too large' }, { status: 400 });
      }
      data.content = body.content;
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

    const chunk = await prisma.promptChunk.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializePromptChunk(chunk));
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('PATCH /api/prompt-chunks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/prompt-chunks/[id]
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
    await assertChunkOwnership(id, user.id);

    await prisma.promptChunk.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('DELETE /api/prompt-chunks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
