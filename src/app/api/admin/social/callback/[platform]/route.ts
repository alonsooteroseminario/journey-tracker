import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  exchangeCodeForToken,
  fetchUserProfile,
} from "@/lib/admin/socialAuth";
import { encrypt } from "@/lib/admin/encryption";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * GET /api/admin/social/callback/[platform]
 * OAuth callback handler - exchanges code for token and saves account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    // Verify admin access
    const user = await requireAdmin();

    const { platform: platformParam } = await params;
    const platform = platformParam as SocialPlatform;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error(`OAuth error for ${platform}:`, error);
      return redirect(`/admin/social?error=${encodeURIComponent(error)}`);
    }

    // Validate authorization code
    if (!code) {
      return redirect("/admin/social?error=missing_code");
    }

    // Generate redirect URI (must match the one used in connect)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/admin/social/callback/${platform}`;

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } =
      await exchangeCodeForToken(platform, code, redirectUri);

    // Fetch user profile
    const profile = await fetchUserProfile(platform, accessToken);

    // Calculate token expiration
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Encrypt tokens
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        userId_platform_platformUserId: {
          userId: user.id,
          platform,
          platformUserId: profile.platformUserId,
        },
      },
    });

    if (existingAccount) {
      // Update existing account
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          username: profile.username,
          displayName: profile.displayName,
          profileImage: profile.profileImage,
          metadata: profile.metadata,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Create new account
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform,
          platformUserId: profile.platformUserId,
          username: profile.username,
          displayName: profile.displayName,
          profileImage: profile.profileImage,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          metadata: profile.metadata,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });
    }

    // Redirect to social connections page with success message
    return redirect("/admin/social?success=connected");
  } catch (error) {
    const { platform: platformParam } = await params;
    console.error(`Error in ${platformParam} OAuth callback:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return redirect(
      `/admin/social?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
