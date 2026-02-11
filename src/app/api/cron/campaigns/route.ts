/**
 * Campaign execution cron job
 * Runs every 5 minutes to process scheduled posts for active campaigns
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/campaigns",
 *     "schedule": "0,5,10,15,20,25,30,35,40,45,50,55 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  executeCampaign,
  getCampaignsNeedingExecution,
} from "@/lib/admin/campaigns/executor";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Campaign Cron] Starting campaign execution check");

    // Get campaigns that need execution
    const campaignIds = await getCampaignsNeedingExecution();

    if (campaignIds.length === 0) {
      console.log("[Campaign Cron] No campaigns need execution");
      return NextResponse.json({
        success: true,
        message: "No campaigns need execution",
        campaignsProcessed: 0,
      });
    }

    console.log(
      `[Campaign Cron] Found ${campaignIds.length} campaigns to execute`
    );

    // Execute campaigns in parallel (with individual error handling)
    const results = await Promise.allSettled(
      campaignIds.map((id) => executeCampaign(id))
    );

    // Aggregate results
    let totalPostsProcessed = 0;
    let totalPostsSucceeded = 0;
    let totalPostsFailed = 0;
    const allErrors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const data = result.value;
        totalPostsProcessed += data.postsProcessed;
        totalPostsSucceeded += data.postsSucceeded;
        totalPostsFailed += data.postsFailed;
        allErrors.push(...data.errors);
      } else {
        allErrors.push(
          `Campaign ${campaignIds[index]}: ${result.reason?.message || "Unknown error"}`
        );
      }
    });

    console.log(
      `[Campaign Cron] Processed ${totalPostsProcessed} posts: ${totalPostsSucceeded} succeeded, ${totalPostsFailed} failed`
    );

    return NextResponse.json({
      success: true,
      campaignsProcessed: campaignIds.length,
      postsProcessed: totalPostsProcessed,
      postsSucceeded: totalPostsSucceeded,
      postsFailed: totalPostsFailed,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    console.error("[Campaign Cron] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
