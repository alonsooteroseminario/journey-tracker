/**
 * Social analytics cron job
 * Runs daily to fetch engagement metrics for recent posts
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/social-analytics",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateRecentPostsAnalytics } from "@/lib/admin/social/analyticsTracker";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Social Analytics Cron] Starting analytics update");

    // Get all users who have social accounts
    const users = await prisma.user.findMany({
      where: {
        socialAccounts: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (users.length === 0) {
      console.log("[Social Analytics Cron] No users with social accounts");
      return NextResponse.json({
        success: true,
        message: "No users with social accounts",
        usersProcessed: 0,
      });
    }

    console.log(
      `[Social Analytics Cron] Found ${users.length} users to process`
    );

    // Process users sequentially to avoid rate limits
    let totalPostsUpdated = 0;
    const allErrors: string[] = [];

    for (const user of users) {
      try {
        const result = await updateRecentPostsAnalytics(user.id);
        totalPostsUpdated += result.postsUpdated;
        allErrors.push(...result.errors);

        // Wait 1 second between users
        if (users.indexOf(user) < users.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        allErrors.push(
          `User ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    console.log(
      `[Social Analytics Cron] Updated ${totalPostsUpdated} posts for ${users.length} users`
    );

    return NextResponse.json({
      success: true,
      usersProcessed: users.length,
      postsUpdated: totalPostsUpdated,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    console.error("[Social Analytics Cron] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
