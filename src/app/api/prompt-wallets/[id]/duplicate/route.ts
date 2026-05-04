import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertWalletOwnership, OwnershipError } from "@/lib/prompts/ownership";
import { serializePromptWallet } from "@/lib/prompts/walletApiShared";

const walletInclude = {
  groups: {
    orderBy: { order: "asc" as const },
    include: { chunks: { orderBy: { order: "asc" as const } } },
  },
} as const;

// POST /api/prompt-wallets/[id]/duplicate
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await assertWalletOwnership(id, user.id);

    const created = await prisma.$transaction(async (tx) => {
      const source = await tx.promptWallet.findFirst({
        where: { id, userId: user.id },
        include: {
          groups: {
            orderBy: { order: "asc" },
            include: {
              chunks: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!source) {
        throw new OwnershipError();
      }

      const last = await tx.promptWallet.findFirst({
        where: { userId: user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = last ? last.order + 1 : 0;

      return tx.promptWallet.create({
        data: {
          userId: user.id,
          title: `${source.title} (copy)`,
          icon: source.icon,
          description: source.description,
          order: nextOrder,
          lockLevel: null,
          groups: {
            create: source.groups.map((g) => ({
              title: g.title,
              description: g.description,
              order: g.order,
              lockLevel: null,
              chunks: {
                create: g.chunks.map((c) => ({
                  title: c.title,
                  content: c.content,
                  order: c.order,
                  lockLevel: null,
                })),
              },
            })),
          },
        },
        include: walletInclude,
      });
    });

    return NextResponse.json(serializePromptWallet(created), { status: 201 });
  } catch (error) {
    if (error instanceof OwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("POST /api/prompt-wallets/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
