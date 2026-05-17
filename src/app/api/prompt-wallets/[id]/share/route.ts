import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/prompts/shareToken";

async function findOwned(walletId: string, userId: string) {
  return prisma.promptWallet.findFirst({ where: { id: walletId, userId } });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wallet = await findOwned(id, user.id);
  if (!wallet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-use existing token to keep the link stable.
  if (wallet.shareToken) {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/wallet/share/${wallet.shareToken}`;
    return NextResponse.json({ shareToken: wallet.shareToken, shareUrl, sharedAt: wallet.sharedAt });
  }

  const shareToken = generateShareToken();
  const updated = await prisma.promptWallet.update({
    where: { id },
    data: { shareToken, sharedAt: new Date() },
  });
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/wallet/share/${shareToken}`;
  return NextResponse.json({ shareToken, shareUrl, sharedAt: updated.sharedAt });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wallet = await findOwned(id, user.id);
  if (!wallet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.promptWallet.update({
    where: { id },
    data: { shareToken: null, sharedAt: null },
  });
  return new NextResponse(null, { status: 204 });
}
