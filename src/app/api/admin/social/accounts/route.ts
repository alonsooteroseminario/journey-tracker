import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/social/accounts
 * List all connected social accounts (without sensitive token data)
 */
export async function GET() {
  try {
    const user = await requireAdmin();

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        username: true,
        displayName: true,
        profileImage: true,
        metadata: true,
        isActive: true,
        lastSyncedAt: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
