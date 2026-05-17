import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/credentials/encrypt";
import { validateAnthropicKey } from "@/lib/anthropic/validateKey";

function maskKey(key: string): string {
  if (key.length <= 4) return "•".repeat(key.length);
  return "•".repeat(Math.min(key.length - 4, 12)) + key.slice(-4);
}

async function findCredential(userId: string) {
  return prisma.lLMCredential.findFirst({
    where: { userId, provider: "anthropic" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cred = await findCredential(user.id);
  if (!cred) {
    return NextResponse.json({ hasKey: false, maskedKey: null, lastValidated: null });
  }
  return NextResponse.json({
    hasKey: true,
    maskedKey: cred.maskedKey,
    lastValidated: cred.lastSyncedAt?.toISOString() ?? null,
  });
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

  const { apiKey } = body as Record<string, unknown>;
  if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return NextResponse.json({ error: "apiKey is required (min 8 chars)" }, { status: 400 });
  }

  const trimmedKey = apiKey.replace(/[​-‍﻿]/g, "").trim();

  const validation = await validateAnthropicKey(trimmedKey);
  if (!validation.valid) {
    const reason = (validation as { reason?: string }).reason ?? "invalid_key";
    if (reason === "rate_limited") {
      return NextResponse.json({ error: "Anthropic rate limit — try again shortly." }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Anthropic rejected the key as invalid. Check and retry." },
      { status: 422 },
    );
  }

  const { encryptedKey, iv } = encryptKey(trimmedKey);
  const maskedKey = maskKey(trimmedKey);
  const keyType = trimmedKey.startsWith("sk-ant-admin-") ? "admin" : "standard";

  const existing = await findCredential(user.id);
  if (existing) {
    await prisma.lLMCredential.delete({ where: { id: existing.id } });
  }

  const cred = await prisma.lLMCredential.create({
    data: {
      userId: user.id,
      provider: "anthropic",
      label: "Default",
      keyType,
      encryptedKey,
      iv,
      maskedKey,
      lastSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ maskedKey: cred.maskedKey, keyType: cred.keyType }, { status: 201 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cred = await findCredential(user.id);
  if (!cred) return NextResponse.json({ error: "No key stored" }, { status: 404 });

  await prisma.lLMCredential.delete({ where: { id: cred.id } });
  return new NextResponse(null, { status: 204 });
}
