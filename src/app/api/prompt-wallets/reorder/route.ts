import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/prompt-wallets/reorder — body { orderedIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderedIds } = body as { orderedIds?: unknown };

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    const owned = await prisma.promptWallet.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((w) => w.id));

    if (orderedIds.length !== ownedIds.size) {
      return NextResponse.json(
        { error: "orderedIds must list each wallet exactly once" },
        { status: 400 }
      );
    }

    for (const id of orderedIds) {
      if (typeof id !== "string" || !ownedIds.has(id)) {
        return NextResponse.json(
          { error: "orderedIds must list each wallet exactly once" },
          { status: 400 }
        );
      }
    }

    const seen = new Set<string>();
    for (const id of orderedIds as string[]) {
      if (seen.has(id)) {
        return NextResponse.json(
          { error: "Duplicate id in orderedIds" },
          { status: 400 }
        );
      }
      seen.add(id);
    }

    if (ownedIds.size === 0) {
      return NextResponse.json({ success: true });
    }

    await prisma.$transaction(
      (orderedIds as string[]).map((id, i) =>
        prisma.promptWallet.update({ where: { id }, data: { order: i } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/prompt-wallets/reorder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
