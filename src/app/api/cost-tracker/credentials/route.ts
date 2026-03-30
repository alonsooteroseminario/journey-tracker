import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptKey } from "@/lib/credentials/encrypt";

const VALID_PROVIDERS = ["anthropic", "elevenlabs"] as const;
const LABEL_REGEX = /^[a-zA-Z0-9 _-]{1,64}$/;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credentials = await prisma.lLMCredential.findMany({
    where: { userId: user.id },
    orderBy: [{ provider: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    credentials.map((c) => ({
      id: c.id,
      provider: c.provider,
      label: c.label,
      keyType: c.keyType ?? null,
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

  const { provider, apiKey, label } = body as Record<string, unknown>;

  if (typeof provider !== "string" || !VALID_PROVIDERS.includes(provider as (typeof VALID_PROVIDERS)[number])) {
    return NextResponse.json({ error: "provider must be 'anthropic' or 'elevenlabs'" }, { status: 400 });
  }
  if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return NextResponse.json({ error: "apiKey is required (minimum 8 characters)" }, { status: 400 });
  }
  if (typeof label !== "string" || !LABEL_REGEX.test(label.trim())) {
    return NextResponse.json(
      { error: "label is required (1–64 chars, letters/numbers/spaces/hyphens/underscores)" },
      { status: 400 }
    );
  }

  const trimmedLabel = label.trim();

  // Strip zero-width / BOM characters that break pasted keys
  const trimmedKey = apiKey.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const { encryptedKey, iv } = encryptKey(trimmedKey);

  // Mask: show last 4 chars, remainder as bullets (spec P1.7)
  const maskedKey =
    trimmedKey.length > 4
      ? `${"•".repeat(Math.min(trimmedKey.length - 4, 12))}${trimmedKey.slice(-4)}`
      : "•".repeat(trimmedKey.length);

  // Detect Anthropic admin key by prefix
  const keyType: string | null =
    provider === "anthropic"
      ? trimmedKey.startsWith("sk-ant-admin-") ? "admin" : "standard"
      : null;

  try {
    const credential = await prisma.lLMCredential.create({
      data: { userId: user.id, provider, label: trimmedLabel, keyType, encryptedKey, iv, maskedKey },
    });
    return NextResponse.json({ id: credential.id, provider, label: trimmedLabel, maskedKey, keyType: credential.keyType ?? null }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: `A credential with label "${trimmedLabel}" already exists for ${provider}` },
        { status: 409 }
      );
    }
    throw e;
  }
}
