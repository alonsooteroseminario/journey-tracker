import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await params;

  const credential = await prisma.lLMCredential.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });

  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lLMCredential.delete({
    where: { userId_provider: { userId: user.id, provider } },
  });

  return NextResponse.json({ success: true });
}
