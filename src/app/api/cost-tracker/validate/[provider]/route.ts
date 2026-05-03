import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptKey } from "@/lib/credentials/encrypt";

const SUPPORTED_PROVIDERS = ["anthropic", "elevenlabs"] as const;
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
      { error: `Unsupported provider for validation: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // fall through to credentialId validation
  }

  const { credentialId } = body;

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
      { error: "No credential found with that id." },
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

  if (provider === "anthropic") {
    const isAdmin = apiKey.startsWith("sk-ant-admin-");
    const keyType: "standard" | "admin" = isAdmin ? "admin" : "standard";

    // Validate standard key by making a minimal models list request.
    // Admin keys use a different base URL — validate by hitting the admin /api-keys endpoint.
    let valid = false;
    let validationError: string | null = null;

    try {
      if (isAdmin) {
        const res = await fetch("https://api.anthropic.com/v1/organizations/api-keys?limit=1", {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        });
        if (res.ok) {
          valid = true;
        } else if (res.status === 401) {
          validationError = "Invalid admin API key.";
        } else {
          validationError = `Anthropic returned HTTP ${res.status}.`;
        }
      } else {
        // Minimal call: list models (cheap, no token cost)
        const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        });
        if (res.ok) {
          valid = true;
        } else if (res.status === 401) {
          validationError = "Invalid API key.";
        } else if (res.status === 403) {
          validationError = "API key does not have permission to list models.";
        } else {
          validationError = `Anthropic returned HTTP ${res.status}.`;
        }
      }
    } catch (e) {
      validationError = e instanceof Error ? e.message : "Network error reaching Anthropic.";
    }

    if (!valid) {
      return NextResponse.json({ error: validationError ?? "Validation failed" }, { status: 422 });
    }

    // Persist detected keyType so the UI can show the Sync button for admin keys
    if (credential.keyType !== keyType) {
      await prisma.lLMCredential.update({
        where: { id: credentialId },
        data: { keyType },
      });
    }

    return NextResponse.json({ valid: true, keyType });
  }

  if (provider === "elevenlabs") {
    let valid = false;
    let validationError: string | null = null;

    try {
      const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        method: "GET",
        headers: { "xi-api-key": apiKey },
      });
      if (res.ok) {
        valid = true;
      } else if (res.status === 401) {
        validationError = "Invalid API key — copy the full key from https://elevenlabs.io/app/settings/api-keys.";
      } else {
        validationError = `ElevenLabs returned HTTP ${res.status}.`;
      }
    } catch (e) {
      validationError = e instanceof Error ? e.message : "Network error reaching ElevenLabs.";
    }

    if (!valid) {
      return NextResponse.json({ error: validationError ?? "Validation failed" }, { status: 422 });
    }

    return NextResponse.json({ valid: true, keyType: null });
  }

  return NextResponse.json({ error: "Provider handler not implemented" }, { status: 501 });
}
