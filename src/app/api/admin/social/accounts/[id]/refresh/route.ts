import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { refreshAccessToken } from "@/lib/admin/socialAuth";
import { encrypt, decrypt } from "@/lib/admin/encryption";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * POST /api/admin/social/accounts/[id]/refresh
 * Refresh access token for a social account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: accountId } = await params;

    // Fetch account with tokens
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!account.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    // Decrypt refresh token
    const refreshToken = decrypt(account.refreshToken);

    // Refresh the token
    const { accessToken, refreshToken: newRefreshToken, expiresIn } =
      await refreshAccessToken(account.platform as SocialPlatform, refreshToken);

    // Calculate token expiration
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Encrypt new tokens
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = newRefreshToken
      ? encrypt(newRefreshToken)
      : account.refreshToken;

    // Update account
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, expiresAt: tokenExpiresAt });
  } catch (error) {
    console.error("Error refreshing social account token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
