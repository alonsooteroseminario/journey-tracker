import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptKey } from "@/lib/credentials/encrypt";
import { syncElevenLabsUsage } from "@/lib/cost-tracking/elevenlabs";
import { syncAnthropicAdminUsage } from "@/lib/cost-tracking/anthropic-admin";
import { CostSyncError } from "@/lib/cost-tracking/sync-error";

const SUPPORTED_PROVIDERS = ["elevenlabs", "anthropic"] as const;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await params;

  if (!SUPPORTED_PROVIDERS.includes(provider as (typeof SUPPORTED_PROVIDERS)[number])) {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body falls through to credentialId validation below
  }

  const { credentialId, test } = body;
  const isTest = test === true;

  if (typeof credentialId !== "string" || !OBJECT_ID_REGEX.test(credentialId)) {
    return NextResponse.json(
      { error: "credentialId is required and must be a valid credential id" },
      { status: 400 }
    );
  }

  const credential = await prisma.lLMCredential.findUnique({
    where: { id: credentialId },
  });

  if (!credential || credential.userId !== user.id) {
    return NextResponse.json(
      { error: `No credential found with that id. Add your API key in the Credentials tab.` },
      { status: 404 }
    );
  }

  if (credential.provider !== provider) {
    return NextResponse.json(
      { error: `Credential provider mismatch: expected ${provider}, got ${credential.provider}` },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decryptKey(credential.encryptedKey, credential.iv);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt credential. Please re-add your API key." },
      { status: 500 }
    );
  }

  if (provider === "elevenlabs") {
    try {
      const result = await syncElevenLabsUsage({ userId: user.id, apiKey, credentialId, test: isTest });

      if (!isTest) {
        await prisma.lLMCredential.update({
          where: { id: credentialId },
          data: { lastSyncedAt: new Date() },
        });
      }

      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof CostSyncError) {
        return NextResponse.json({ error: e.message }, { status: e.statusCode });
      }
      console.error("cost-tracker sync elevenlabs:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Sync failed" },
        { status: 500 }
      );
    }
  }

  if (provider === "anthropic") {
    // Only admin keys support sync — standard keys must use the validate endpoint
    if (credential.keyType !== "admin") {
      return NextResponse.json(
        { error: "Only Anthropic admin keys (sk-ant-admin-...) support usage sync. Standard keys are used for manual cost entry only." },
        { status: 400 }
      );
    }
    try {
      const result = await syncAnthropicAdminUsage({ userId: user.id, apiKey, credentialId, test: isTest });

      if (!isTest) {
        await prisma.lLMCredential.update({
          where: { id: credentialId },
          data: { lastSyncedAt: new Date() },
        });
      }

      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof CostSyncError) {
        return NextResponse.json({ error: e.message }, { status: e.statusCode });
      }
      console.error("cost-tracker sync anthropic:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Sync failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Provider handler not implemented" }, { status: 501 });
}
