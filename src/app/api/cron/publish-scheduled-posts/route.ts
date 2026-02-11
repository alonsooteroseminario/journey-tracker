import { NextRequest, NextResponse } from "next/server";
import { publishPost } from "@/lib/admin/socialPublishing";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/types/admin";

/**
 * GET /api/cron/publish-scheduled-posts
 * Cron job to publish scheduled social posts
 * Should be called every 5-15 minutes via Vercel Cron or external scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find posts scheduled for now or earlier
    const now = new Date();
    const scheduledPosts = await prisma.socialPost.findMany({
      where: {
        status: "scheduled",
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        account: true,
      },
      take: 50, // Process max 50 posts per run
    });

    if (scheduledPosts.length === 0) {
      return NextResponse.json({
        message: "No scheduled posts to publish",
        published: 0,
      });
    }

    const results = {
      total: scheduledPosts.length,
      published: 0,
      failed: 0,
      errors: [] as Array<{ postId: string; error: string }>,
    };

    // Process each post
    for (const post of scheduledPosts) {
      try {
        // Check if account is active
        if (!post.account.isActive) {
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "failed",
              error: "Social account is not active",
            },
          });
          results.failed++;
          results.errors.push({
            postId: post.id,
            error: "Account not active",
          });
          continue;
        }

        // Check if token is expired
        if (
          post.account.tokenExpiresAt &&
          new Date(post.account.tokenExpiresAt) < now
        ) {
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "failed",
              error: "Access token expired. Please refresh the token.",
            },
          });
          results.failed++;
          results.errors.push({
            postId: post.id,
            error: "Token expired",
          });
          continue;
        }

        // Publish the post
        const result = await publishPost(
          post.account.platform as SocialPlatform,
          post.account.accessToken,
          post.content,
          post.mediaUrls
        );

        if (!result.success) {
          // Update with error
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "failed",
              error: result.error,
            },
          });
          results.failed++;
          results.errors.push({
            postId: post.id,
            error: result.error || "Unknown error",
          });
        } else {
          // Update with success
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "posted",
              postedAt: now,
              platformPostId: result.platformPostId,
              postUrl: result.postUrl,
              error: null,
            },
          });
          results.published++;
        }

        // Add small delay between posts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        results.failed++;
        results.errors.push({
          postId: post.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Scheduled posts cron job failed:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled posts" },
      { status: 500 }
    );
  }
}
