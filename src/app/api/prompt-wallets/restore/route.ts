import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  lockLevelToDb,
  serializePromptWallet,
  validateOptionalDescription,
  validateOptionalIcon,
  validateWalletTitle,
} from "@/lib/prompts/walletApiShared";

const walletInclude = {
  groups: {
    orderBy: { order: "asc" as const },
    include: { chunks: { orderBy: { order: "asc" as const } } },
  },
} as const;

function validateRestoreChunk(c: unknown): string | null {
  if (!c || typeof c !== "object") {
    return "Each chunk must be an object";
  }
  const o = c as Record<string, unknown>;
  const titleErr = validateWalletTitle(o.title);
  if (titleErr) {
    return `Chunk title: ${titleErr}`;
  }
  if (typeof o.content !== "string") {
    return "Chunk content must be a string";
  }
  if (o.content.length > 100_000) {
    return "Chunk content is too large";
  }
  return null;
}

function validateRestoreGroup(g: unknown): string | null {
  if (!g || typeof g !== "object") {
    return "Each group must be an object";
  }
  const o = g as Record<string, unknown>;
  const titleErr = validateWalletTitle(o.title);
  if (titleErr) {
    return `Group title: ${titleErr}`;
  }
  const descErr = validateOptionalDescription(o.description);
  if (descErr) {
    return descErr;
  }
  if (!Array.isArray(o.chunks)) {
    return "Group chunks must be an array";
  }
  for (const c of o.chunks) {
    const err = validateRestoreChunk(c);
    if (err) {
      return err;
    }
  }
  return null;
}

// POST /api/prompt-wallets/restore — recreate tree from snapshot (undo)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const titleErr = validateWalletTitle(body.title);
    if (titleErr) {
      return NextResponse.json({ error: titleErr }, { status: 400 });
    }
    const descErr = validateOptionalDescription(body.description);
    if (descErr) {
      return NextResponse.json({ error: descErr }, { status: 400 });
    }
    const iconErr = validateOptionalIcon(body.icon);
    if (iconErr) {
      return NextResponse.json({ error: iconErr }, { status: 400 });
    }

    if (!Array.isArray(body.groups)) {
      return NextResponse.json(
        { error: "groups must be an array" },
        { status: 400 }
      );
    }

    for (const g of body.groups) {
      const err = validateRestoreGroup(g);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
    }

    let walletLock: string | null;
    try {
      walletLock = lockLevelToDb(body.lockLevel);
    } catch {
      return NextResponse.json({ error: "Invalid lockLevel" }, { status: 400 });
    }

    const title = (body.title as string).trim();
    const last = await prisma.promptWallet.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = last ? last.order + 1 : 0;

    const wallet = await prisma.promptWallet.create({
      data: {
        userId: user.id,
        title,
        icon:
          typeof body.icon === "string" && body.icon.trim().length > 0
            ? body.icon.trim()
            : null,
        description:
          typeof body.description === "string" && body.description.trim().length > 0
            ? body.description.trim()
            : null,
        order: nextOrder,
        lockLevel: walletLock,
        groups: {
          create: (body.groups as Record<string, unknown>[]).map((g, gi) => {
            let groupLock: string | null;
            try {
              groupLock = lockLevelToDb(g.lockLevel);
            } catch {
              throw new Error("INVALID_GROUP_LOCK");
            }
            const chunks = g.chunks as Record<string, unknown>[];
            return {
              title: (g.title as string).trim(),
              description:
                typeof g.description === "string" && g.description.trim().length > 0
                  ? g.description.trim()
                  : null,
              order: gi,
              lockLevel: groupLock,
              chunks: {
                create: chunks.map((c, ci) => {
                  let chunkLock: string | null;
                  try {
                    chunkLock = lockLevelToDb(c.lockLevel);
                  } catch {
                    throw new Error("INVALID_CHUNK_LOCK");
                  }
                  return {
                    title: (c.title as string).trim(),
                    content: c.content as string,
                    order: ci,
                    lockLevel: chunkLock,
                  };
                }),
              },
            };
          }),
        },
      },
      include: walletInclude,
    });

    return NextResponse.json(serializePromptWallet(wallet), { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "INVALID_GROUP_LOCK" ||
        error.message === "INVALID_CHUNK_LOCK")
    ) {
      return NextResponse.json({ error: "Invalid lockLevel" }, { status: 400 });
    }
    console.error("POST /api/prompt-wallets/restore error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
