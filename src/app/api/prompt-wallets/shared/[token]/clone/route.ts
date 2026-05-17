import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;

  const source = await prisma.promptWallet.findFirst({
    where: { shareToken: token },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: { chunks: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Create new wallet owned by viewer — private by default, locks reset.
  const clone = await prisma.promptWallet.create({
    data: {
      userId: user.id,
      title: `Copy of ${source.title}`,
      icon: source.icon,
      description: source.description,
      shareToken: null,
      sharedAt: null,
    },
  });

  for (const group of source.groups) {
    const clonedGroup = await prisma.promptGroup.create({
      data: {
        walletId: clone.id,
        title: group.title,
        description: group.description,
        order: group.order,
      },
    });
    for (const chunk of group.chunks) {
      await prisma.promptChunk.create({
        data: {
          groupId: clonedGroup.id,
          title: chunk.title,
          content: chunk.content,
          order: chunk.order,
          lockLevel: null, // locks are owner-scoped; clones start unlocked
        },
      });
    }
  }

  return NextResponse.json({ walletId: clone.id }, { status: 201 });
}
