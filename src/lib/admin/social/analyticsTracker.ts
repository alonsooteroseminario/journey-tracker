/**
 * Social media analytics tracker
 * Fetches engagement metrics from Twitter and Instagram APIs
 */

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/admin/encryption";

interface PostAnalytics {
  impressions?: number;
  likes?: number;
  retweets?: number;
  comments?: number;
  clicks?: number;
}

/**
 * Fetch analytics for a Twitter post
 */
async function fetchTwitterAnalytics(
  accessToken: string,
  tweetId: string
): Promise<PostAnalytics | null> {
  try {
    // Twitter API v2 - Get Tweet metrics
    // https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Twitter analytics fetch failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.data) {
      return null;
    }

    const publicMetrics = data.data.public_metrics || {};
    const nonPublicMetrics = data.data.non_public_metrics || {};

    return {
      impressions: nonPublicMetrics.impression_count || publicMetrics.impression_count || 0,
      likes: publicMetrics.like_count || 0,
      retweets: publicMetrics.retweet_count || 0,
      comments: publicMetrics.reply_count || 0,
      clicks: nonPublicMetrics.url_link_clicks || 0,
    };
  } catch (error) {
    console.error("Error fetching Twitter analytics:", error);
    return null;
  }
}

/**
 * Fetch analytics for an Instagram post
 */
async function fetchInstagramAnalytics(
  accessToken: string,
  mediaId: string
): Promise<PostAnalytics | null> {
  try {
    // Instagram Graph API - Get media insights
    // https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
    const response = await fetch(
      `https://graph.instagram.com/${mediaId}/insights?metric=impressions,likes,comments,saved&access_token=${accessToken}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      console.error(
        `Instagram analytics fetch failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.data) {
      return null;
    }

    // Parse insights data
    const insights: Record<string, number> = {};
    data.data.forEach((insight: any) => {
      if (insight.name && insight.values && insight.values[0]) {
        insights[insight.name] = insight.values[0].value || 0;
      }
    });

    return {
      impressions: insights.impressions || 0,
      likes: insights.likes || 0,
      comments: insights.comments || 0,
      clicks: 0, // Instagram doesn't provide click metrics in basic insights
    };
  } catch (error) {
    console.error("Error fetching Instagram analytics:", error);
    return null;
  }
}

/**
 * Update analytics for a single post
 */
export async function updatePostAnalytics(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        account: true,
      },
    });

    if (!post || !post.platformPostId || post.status !== "posted") {
      return { success: false, error: "Post not found or not posted" };
    }

    // Decrypt access token
    const accessToken = decrypt(post.account.accessToken);

    // Fetch analytics based on platform
    let analytics: PostAnalytics | null = null;

    if (post.account.platform === "twitter") {
      analytics = await fetchTwitterAnalytics(accessToken, post.platformPostId);
    } else if (post.account.platform === "instagram") {
      analytics = await fetchInstagramAnalytics(
        accessToken,
        post.platformPostId
      );
    }

    if (!analytics) {
      return { success: false, error: "Failed to fetch analytics" };
    }

    // Update post with analytics
    await prisma.socialPost.update({
      where: { id: postId },
      data: {
        impressions: analytics.impressions,
        likes: analytics.likes,
        retweets: analytics.retweets,
        comments: analytics.comments,
        clicks: analytics.clicks,
        analyticsLastFetched: new Date(),
        analytics: analytics as any, // Store full JSON for historical tracking
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating post analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update analytics for all recent posts (last 7 days)
 */
export async function updateRecentPostsAnalytics(
  userId: string
): Promise<{
  success: boolean;
  postsUpdated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let postsUpdated = 0;

  try {
    // Get posts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await prisma.socialPost.findMany({
      where: {
        userId,
        status: "posted",
        postedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
      },
    });

    console.log(
      `[Analytics Tracker] Found ${posts.length} posts to update for user ${userId}`
    );

    // Update each post (with rate limiting)
    for (const post of posts) {
      const result = await updatePostAnalytics(post.id);

      if (result.success) {
        postsUpdated++;
      } else {
        errors.push(`Post ${post.id}: ${result.error}`);
      }

      // Rate limiting: wait 500ms between API calls
      if (posts.indexOf(post) < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return {
      success: true,
      postsUpdated,
      errors,
    };
  } catch (error) {
    console.error("Error updating recent posts analytics:", error);
    return {
      success: false,
      postsUpdated,
      errors: [
        ...errors,
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }
}
