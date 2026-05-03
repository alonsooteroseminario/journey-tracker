import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptKey } from "@/lib/credentials/encrypt";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const LABEL_REGEX = /^[a-zA-Z0-9 _-]{1,64}$/;

// DELETE and PATCH /api/cost-tracker/credentials/[id]
// The route segment is named [provider] for legacy filesystem reasons; it captures the credential id.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: id } = await params;

  if (!OBJECT_ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid credential id" }, { status: 400 });
  }

  const credential = await prisma.lLMCredential.findUnique({ where: { id } });

  if (!credential || credential.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lLMCredential.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: id } = await params;

  if (!OBJECT_ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid credential id" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, apiKey } = body;

  // At least one field must be provided
  if (label === undefined && apiKey === undefined) {
    return NextResponse.json(
      { error: "Provide at least one of: label, apiKey" },
      { status: 400 }
    );
  }

  // Validate label if provided
  if (label !== undefined) {
    if (typeof label !== "string" || !LABEL_REGEX.test(label.trim())) {
      return NextResponse.json(
        { error: "label must be 1–64 chars, letters/numbers/spaces/hyphens/underscores" },
        { status: 400 }
      );
    }
  }

  // Validate apiKey if provided
  if (apiKey !== undefined) {
    if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
      return NextResponse.json(
        { error: "apiKey must be at least 8 characters" },
        { status: 400 }
      );
    }
  }

  const credential = await prisma.lLMCredential.findUnique({ where: { id } });

  if (!credential || credential.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (label !== undefined) {
    updateData.label = (label as string).trim();
  }

  if (apiKey !== undefined) {
    const trimmedKey = (apiKey as string).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const { encryptedKey, iv } = encryptKey(trimmedKey);

    const maskedKey =
      trimmedKey.length > 4
        ? `${"•".repeat(Math.min(trimmedKey.length - 4, 12))}${trimmedKey.slice(-4)}`
        : "•".repeat(trimmedKey.length);

    const keyType: string | null =
      credential.provider === "anthropic"
        ? trimmedKey.startsWith("sk-ant-admin-") ? "admin" : "standard"
        : null;

    updateData.encryptedKey = encryptedKey;
    updateData.iv = iv;
    updateData.maskedKey = maskedKey;
    updateData.keyType = keyType;
  }

  const updated = await prisma.lLMCredential.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    provider: updated.provider,
    label: updated.label,
    maskedKey: updated.maskedKey,
    keyType: updated.keyType ?? null,
  });
}
