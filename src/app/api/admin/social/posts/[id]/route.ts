import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { validatePostContent } from "@/lib/admin/socialPublishing";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * PATCH /api/admin/social/posts/[id]
 * Update a social post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: postId } = await params;
    const body = await request.json();

    // Fetch existing post
    const existingPost = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        account: {
          select: { platform: true },
        },
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't edit already posted content
    if (existingPost.status === "posted") {
      return NextResponse.json(
        { error: "Cannot edit already posted content" },
        { status: 400 }
      );
    }

    const {
      content,
      mediaUrls,
      hashtags,
      scheduledFor,
      status,
      linkedGoalId,
    } = body;

    // Validate content if updated
    if (content !== undefined) {
      const validation = validatePostContent(
        existingPost.account.platform as SocialPlatform,
        content,
        mediaUrls || existingPost.mediaUrls
      );

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Update post
    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        ...(content !== undefined && { content }),
        ...(mediaUrls !== undefined && { mediaUrls }),
        ...(hashtags !== undefined && { hashtags }),
        ...(scheduledFor !== undefined && {
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        }),
        ...(status !== undefined && { status }),
        ...(linkedGoalId !== undefined && { linkedGoalId }),
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

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating social post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/social/posts/[id]
 * Delete a social post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: postId } = await params;

    // Verify ownership
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      select: { userId: true, status: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't delete already posted content
    if (post.status === "posted") {
      return NextResponse.json(
        { error: "Cannot delete already posted content" },
        { status: 400 }
      );
    }

    // Delete the post
    await prisma.socialPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
