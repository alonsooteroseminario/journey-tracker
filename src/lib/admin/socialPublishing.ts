import { decrypt } from "./encryption";
import type { SocialPlatform } from "@/types/admin";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Publish a post to Twitter (X)
 */
async function publishToTwitter(
  accessToken: string,
  content: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  try {
    // Note: Twitter API v2 requires media to be uploaded first
    // This is a simplified implementation
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: content,
        // media would require separate upload flow
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Twitter API error: ${error}`,
      };
    }

    const data = await response.json();
    const tweetId = data.data.id;

    return {
      success: true,
      platformPostId: tweetId,
      postUrl: `https://twitter.com/i/web/status/${tweetId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Publish a post to Instagram
 */
async function publishToInstagram(
  accessToken: string,
  content: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  try {
    // Instagram requires a two-step process:
    // 1. Create media container
    // 2. Publish the container
    // This is a simplified implementation

    if (mediaUrls.length === 0) {
      return {
        success: false,
        error: "Instagram requires at least one image",
      };
    }

    // Step 1: Create container
    const createResponse = await fetch(
      `https://graph.instagram.com/me/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption: content,
          access_token: accessToken,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return {
        success: false,
        error: `Instagram API error: ${error}`,
      };
    }

    const createData = await createResponse.json();
    const containerId = createData.id;

    // Step 2: Publish container
    const publishResponse = await fetch(
      `https://graph.instagram.com/me/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      return {
        success: false,
        error: `Instagram publish error: ${error}`,
      };
    }

    const publishData = await publishResponse.json();
    const postId = publishData.id;

    return {
      success: true,
      platformPostId: postId,
      postUrl: `https://www.instagram.com/p/${postId}/`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Publish a post to a social platform
 */
export async function publishPost(
  platform: SocialPlatform,
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  // Decrypt access token
  const accessToken = decrypt(encryptedAccessToken);

  switch (platform) {
    case "twitter":
      return publishToTwitter(accessToken, content, mediaUrls);
    case "instagram":
      return publishToInstagram(accessToken, content, mediaUrls);
    default:
      return {
        success: false,
        error: `Unsupported platform: ${platform}`,
      };
  }
}

/**
 * Validate post content for platform
 */
export function validatePostContent(
  platform: SocialPlatform,
  content: string,
  mediaUrls: string[]
): { valid: boolean; error?: string } {
  switch (platform) {
    case "twitter":
      if (content.length > 280) {
        return {
          valid: false,
          error: "Twitter posts must be 280 characters or less",
        };
      }
      if (mediaUrls.length > 4) {
        return {
          valid: false,
          error: "Twitter allows maximum 4 media attachments",
        };
      }
      break;

    case "instagram":
      if (mediaUrls.length === 0) {
        return {
          valid: false,
          error: "Instagram requires at least one image",
        };
      }
      if (content.length > 2200) {
        return {
          valid: false,
          error: "Instagram captions must be 2200 characters or less",
        };
      }
      if (mediaUrls.length > 10) {
        return {
          valid: false,
          error: "Instagram allows maximum 10 media items",
        };
      }
      break;
  }

  return { valid: true };
}
