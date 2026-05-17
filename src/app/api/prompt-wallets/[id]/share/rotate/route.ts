import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/prompts/shareToken";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const wallet = await prisma.promptWallet.findFirst({ where: { id, userId: user.id } });
  if (!wallet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareToken = generateShareToken();
  const updated = await prisma.promptWallet.update({
    where: { id },
    data: { shareToken, sharedAt: new Date() },
  });
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/wallet/share/${shareToken}`;
  return NextResponse.json({ shareToken, shareUrl, sharedAt: updated.sharedAt });
}
