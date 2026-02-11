/**
 * A/B testing utilities for marketing campaigns
 */

import { prisma } from "@/lib/prisma";

export interface ABTestConfig {
  enabled: boolean;
  variants: string[]; // ["A", "B"]
  metric: "engagement" | "impressions" | "clicks"; // Primary metric to optimize
  sampleSize?: number; // Number of posts per variant (optional)
}

export interface ABTestResults {
  variantA: {
    posts: number;
    avgImpressions: number;
    avgLikes: number;
    avgRetweets: number;
    avgComments: number;
    avgClicks: number;
    totalEngagement: number;
  };
  variantB: {
    posts: number;
    avgImpressions: number;
    avgLikes: number;
    avgRetweets: number;
    avgComments: number;
    avgClicks: number;
    totalEngagement: number;
  };
  winner: "A" | "B" | "tie" | "insufficient_data";
  confidence: number; // 0-100
}

/**
 * Enable A/B testing for a campaign
 */
export async function enableABTest(
  campaignId: string,
  config: ABTestConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        abTestEnabled: true,
        abTestConfig: config as any, // Cast to any for Prisma Json type
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error enabling A/B test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Assign A/B test group to a post
 */
export function assignABTestGroup(existingPostsCount: number): "A" | "B" {
  // Alternate between A and B to balance distribution
  return existingPostsCount % 2 === 0 ? "A" : "B";
}

/**
 * Get A/B test results for a campaign
 */
export async function getABTestResults(
  campaignId: string
): Promise<ABTestResults | null> {
  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        posts: {
          where: {
            status: "posted",
            abTestGroup: {
              in: ["A", "B"],
            },
          },
          select: {
            abTestGroup: true,
            impressions: true,
            likes: true,
            retweets: true,
            comments: true,
            clicks: true,
          },
        },
      },
    });

    if (!campaign || !campaign.abTestEnabled) {
      return null;
    }

    // Separate posts by variant
    const variantAPosts = campaign.posts.filter((p) => p.abTestGroup === "A");
    const variantBPosts = campaign.posts.filter((p) => p.abTestGroup === "B");

    if (variantAPosts.length === 0 || variantBPosts.length === 0) {
      return {
        variantA: createEmptyVariantResult(),
        variantB: createEmptyVariantResult(),
        winner: "insufficient_data",
        confidence: 0,
      };
    }

    // Calculate metrics for variant A
    const variantAMetrics = calculateVariantMetrics(variantAPosts);
    const variantBMetrics = calculateVariantMetrics(variantBPosts);

    // Determine winner based on primary metric
    const config = campaign.abTestConfig as unknown as ABTestConfig;
    const primaryMetric = config?.metric || "engagement";

    let winner: "A" | "B" | "tie" = "tie";
    let confidence = 0;

    if (primaryMetric === "engagement") {
      const aEngagement = variantAMetrics.totalEngagement;
      const bEngagement = variantBMetrics.totalEngagement;
      const diff = Math.abs(aEngagement - bEngagement);
      const avg = (aEngagement + bEngagement) / 2;

      if (diff > avg * 0.1) {
        // 10% difference threshold
        winner = aEngagement > bEngagement ? "A" : "B";
        confidence = Math.min(95, (diff / avg) * 100);
      }
    } else if (primaryMetric === "impressions") {
      const aDiff = variantAMetrics.avgImpressions - variantBMetrics.avgImpressions;
      if (Math.abs(aDiff) > variantAMetrics.avgImpressions * 0.1) {
        winner = aDiff > 0 ? "A" : "B";
        confidence = Math.min(
          95,
          (Math.abs(aDiff) / variantAMetrics.avgImpressions) * 100
        );
      }
    } else if (primaryMetric === "clicks") {
      const aDiff = variantAMetrics.avgClicks - variantBMetrics.avgClicks;
      if (Math.abs(aDiff) > variantAMetrics.avgClicks * 0.1) {
        winner = aDiff > 0 ? "A" : "B";
        confidence = Math.min(
          95,
          (Math.abs(aDiff) / variantAMetrics.avgClicks) * 100
        );
      }
    }

    return {
      variantA: variantAMetrics,
      variantB: variantBMetrics,
      winner,
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error("Error getting A/B test results:", error);
    return null;
  }
}

/**
 * Calculate metrics for a variant
 */
function calculateVariantMetrics(posts: any[]) {
  const count = posts.length;

  if (count === 0) {
    return createEmptyVariantResult();
  }

  const sum = posts.reduce(
    (acc, post) => ({
      impressions: acc.impressions + (post.impressions || 0),
      likes: acc.likes + (post.likes || 0),
      retweets: acc.retweets + (post.retweets || 0),
      comments: acc.comments + (post.comments || 0),
      clicks: acc.clicks + (post.clicks || 0),
    }),
    { impressions: 0, likes: 0, retweets: 0, comments: 0, clicks: 0 }
  );

  const avg = {
    avgImpressions: Math.round(sum.impressions / count),
    avgLikes: Math.round(sum.likes / count),
    avgRetweets: Math.round(sum.retweets / count),
    avgComments: Math.round(sum.comments / count),
    avgClicks: Math.round(sum.clicks / count),
  };

  const totalEngagement = sum.likes + sum.retweets + sum.comments + sum.clicks;

  return {
    posts: count,
    ...avg,
    totalEngagement,
  };
}

/**
 * Create empty variant result
 */
function createEmptyVariantResult() {
  return {
    posts: 0,
    avgImpressions: 0,
    avgLikes: 0,
    avgRetweets: 0,
    avgComments: 0,
    avgClicks: 0,
    totalEngagement: 0,
  };
}
