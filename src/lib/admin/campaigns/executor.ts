/**
 * Campaign execution engine
 * Processes scheduled posts for active campaigns
 */

import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/admin/socialPublishing";
import { decrypt } from "@/lib/admin/encryption";

/**
 * Execute campaign - process pending scheduled posts
 */
export async function executeCampaign(campaignId: string): Promise<{
  success: boolean;
  postsProcessed: number;
  postsSucceeded: number;
  postsFailed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let postsProcessed = 0;
  let postsSucceeded = 0;
  let postsFailed = 0;

  try {
    // Get campaign with pending scheduled posts
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        posts: {
          where: {
            status: "scheduled",
            scheduledFor: {
              lte: new Date(),
            },
          },
          include: {
            account: true,
          },
          orderBy: {
            scheduledFor: "asc",
          },
          take: 10, // Process up to 10 posts per campaign execution
        },
      },
    });

    if (!campaign) {
      return {
        success: false,
        postsProcessed: 0,
        postsSucceeded: 0,
        postsFailed: 0,
        errors: ["Campaign not found"],
      };
    }

    if (campaign.status !== "active") {
      return {
        success: true,
        postsProcessed: 0,
        postsSucceeded: 0,
        postsFailed: 0,
        errors: [],
      };
    }

    // Process each scheduled post
    for (const post of campaign.posts) {
      postsProcessed++;

      try {
        // Decrypt access token
        const decryptedToken = decrypt(post.account.accessToken);

        // Publish post
        const result = await publishPost(
          post.account.platform as "twitter" | "instagram",
          decryptedToken,
          post.content,
          post.mediaUrls
        );

        if (result.success) {
          // Update post status
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "posted",
              postedAt: new Date(),
              platformPostId: result.platformPostId,
              postUrl: result.postUrl,
              error: null,
            },
          });
          postsSucceeded++;
        } else {
          // Mark as failed
          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "failed",
              error: result.error || "Unknown error",
            },
          });
          postsFailed++;
          errors.push(`Post ${post.id}: ${result.error}`);
        }

        // Rate limiting: wait 1 second between posts
        if (postsProcessed < campaign.posts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        postsFailed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Post ${post.id}: ${errorMessage}`);

        // Update post with error
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
            error: errorMessage,
          },
        });
      }
    }

    return {
      success: true,
      postsProcessed,
      postsSucceeded,
      postsFailed,
      errors,
    };
  } catch (error) {
    console.error("Error executing campaign:", error);
    return {
      success: false,
      postsProcessed,
      postsSucceeded,
      postsFailed,
      errors: [
        ...errors,
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }
}

/**
 * Get campaigns that need execution
 */
export async function getCampaignsNeedingExecution(): Promise<string[]> {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: {
      status: "active",
    },
    select: {
      id: true,
      posts: {
        where: {
          status: "scheduled",
          scheduledFor: {
            lte: new Date(),
          },
        },
        take: 1,
      },
    },
  });

  // Return campaign IDs that have pending posts
  return campaigns.filter((c) => c.posts.length > 0).map((c) => c.id);
}
