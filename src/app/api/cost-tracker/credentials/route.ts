import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptKey } from "@/lib/credentials/encrypt";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credentials = await prisma.lLMCredential.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    credentials.map((c) => ({
      provider: c.provider,
      maskedKey: c.maskedKey,
      lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, apiKey } = body as Record<string, unknown>;

  if (typeof provider !== "string" || !["anthropic", "elevenlabs"].includes(provider)) {
    return NextResponse.json({ error: "provider must be 'anthropic' or 'elevenlabs'" }, { status: 400 });
  }
  if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  // Strip zero-width / BOM characters that break pasted keys
  const trimmedKey = apiKey.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const { encryptedKey, iv } = encryptKey(trimmedKey);

  // Mask: show first 8 chars + bullets
  const maskedKey =
    trimmedKey.length > 8
      ? `${trimmedKey.slice(0, 8)}${"•".repeat(Math.min(trimmedKey.length - 8, 12))}`
      : "•".repeat(trimmedKey.length);

  await prisma.lLMCredential.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    update: { encryptedKey, iv, maskedKey, lastSyncedAt: null },
    create: { userId: user.id, provider, encryptedKey, iv, maskedKey },
  });

  return NextResponse.json({ provider, maskedKey }, { status: 201 });
}
