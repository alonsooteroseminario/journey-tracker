import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const wallet = await prisma.promptWallet.findUnique({
    where: { shareToken: token },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: {
          chunks: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!wallet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owner = await prisma.user.findUnique({
    where: { id: wallet.userId },
    select: { name: true },
  });

  // Strip internal fields — never expose userId or shareToken to public viewers.
  const { userId: _uid, shareToken: _tok, ...publicWallet } = wallet;

  return NextResponse.json(
    { wallet: publicWallet, ownerName: owner?.name ?? "Unknown" },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    },
  );
}
