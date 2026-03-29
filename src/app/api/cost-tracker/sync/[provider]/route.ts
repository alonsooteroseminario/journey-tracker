import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptKey } from "@/lib/credentials/encrypt";
import { syncElevenLabsUsage } from "@/lib/cost-tracking/elevenlabs";
import { CostSyncError } from "@/lib/cost-tracking/sync-error";

const SUPPORTED_PROVIDERS = ["elevenlabs"] as const;

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
    // Empty body is fine
  }

  const isTest = body.test === true;

  const credential = await prisma.lLMCredential.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });

  if (!credential) {
    return NextResponse.json(
      { error: `No ${provider} credential found. Add your API key in the Credentials tab.` },
      { status: 404 }
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
      const result = await syncElevenLabsUsage({ userId: user.id, apiKey, test: isTest });

      if (!isTest) {
        await prisma.lLMCredential.update({
          where: { userId_provider: { userId: user.id, provider } },
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

  return NextResponse.json({ error: "Provider handler not implemented" }, { status: 501 });
}
