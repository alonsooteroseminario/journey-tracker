import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { validatePostContent } from "@/lib/admin/socialPublishing";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * GET /api/admin/social/posts
 * List all social posts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const accountId = searchParams.get("accountId") || undefined;

    const posts = await prisma.socialPost.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
        ...(accountId && { accountId }),
      },
      include: {
        account: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching social posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/social/posts
 * Create a new social post
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const {
      accountId,
      content,
      mediaUrls = [],
      hashtags = [],
      scheduledFor,
      linkedGoalId,
    } = body;

    // Validate required fields
    if (!accountId || !content) {
      return NextResponse.json(
        { error: "accountId and content are required" },
        { status: 400 }
      );
    }

    // Verify account ownership
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: { userId: true, platform: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate content for platform
    const validation = validatePostContent(
      account.platform as SocialPlatform,
      content,
      mediaUrls
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create post
    const post = await prisma.socialPost.create({
      data: {
        userId: user.id,
        accountId,
        content,
        mediaUrls,
        hashtags,
        status: scheduledFor ? "scheduled" : "draft",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        linkedGoalId,
      },
      include: {
        account: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
