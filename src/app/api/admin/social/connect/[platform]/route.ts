import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getAuthorizationUrl } from "@/lib/admin/socialAuth";
import type { SocialPlatform } from "@/types/admin";

/**
 * GET /api/admin/social/connect/[platform]
 * Initiates OAuth flow by redirecting to platform authorization URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { platform: platformParam } = await params;
    const platform = platformParam as SocialPlatform;
    const supportedPlatforms: SocialPlatform[] = ["twitter", "instagram"];

    if (!supportedPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    // Generate redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/admin/social/callback/${platform}`;

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();

    // Store state in session/cookie for validation (simplified for now)
    // In production, use encrypted session storage

    // Get authorization URL
    const authUrl = getAuthorizationUrl(platform, redirectUri, state);

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    const { platform: platformParam } = await params;
    console.error(`Error initiating ${platformParam} OAuth:`, error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
