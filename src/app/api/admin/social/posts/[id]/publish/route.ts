import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { publishPost } from "@/lib/admin/socialPublishing";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * POST /api/admin/social/posts/[id]/publish
 * Publish a post immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: postId } = await params;

    // Fetch post with account details
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        account: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (post.status === "posted") {
      return NextResponse.json(
        { error: "Post already published" },
        { status: 400 }
      );
    }

    if (!post.account.isActive) {
      return NextResponse.json(
        { error: "Social account is not active" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (
      post.account.tokenExpiresAt &&
      new Date(post.account.tokenExpiresAt) < new Date()
    ) {
      return NextResponse.json(
        { error: "Access token expired. Please refresh the token." },
        { status: 400 }
      );
    }

    // Publish the post
    const result = await publishPost(
      post.account.platform as SocialPlatform,
      post.account.accessToken,
      post.content,
      post.mediaUrls
    );

    if (!result.success) {
      // Update post with error
      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "failed",
          error: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Update post with success
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: "posted",
        postedAt: new Date(),
        platformPostId: result.platformPostId,
        postUrl: result.postUrl,
        error: null,
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

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error publishing social post:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
