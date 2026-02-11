import type { SocialPlatform, SocialOAuthConfig } from "@/types/admin";

/**
 * OAuth configuration for each social platform
 */
export function getOAuthConfig(platform: SocialPlatform): SocialOAuthConfig {
  switch (platform) {
    case "twitter":
      return {
        clientId: process.env.TWITTER_CLIENT_ID || "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      };
    case "instagram":
      return {
        clientId: process.env.INSTAGRAM_CLIENT_ID || "",
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
        authUrl: "https://api.instagram.com/oauth/authorize",
        tokenUrl: "https://api.instagram.com/oauth/access_token",
        scope: ["user_profile", "user_media"],
      };
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(
  platform: SocialPlatform,
  redirectUri: string,
  state: string
): string {
  const config = getOAuthConfig(platform);

  if (!config.clientId) {
    throw new Error(`${platform.toUpperCase()}_CLIENT_ID not configured`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
    state,
  });

  // Twitter OAuth 2.0 requires additional parameters
  if (platform === "twitter") {
    params.set("code_challenge", "challenge");
    params.set("code_challenge_method", "plain");
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
}> {
  const config = getOAuthConfig(platform);

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`OAuth credentials not configured for ${platform}`);
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  // Twitter OAuth 2.0 requires code_verifier
  if (platform === "twitter") {
    body.set("code_verifier", "challenge");
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresIn: data.expires_in || null,
  };
}

/**
 * Fetch user profile from social platform
 */
export async function fetchUserProfile(
  platform: SocialPlatform,
  accessToken: string
): Promise<{
  platformUserId: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  metadata: any;
}> {
  switch (platform) {
    case "twitter": {
      const response = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Twitter profile");
      }

      const data = await response.json();
      const user = data.data;

      return {
        platformUserId: user.id,
        username: user.username,
        displayName: user.name,
        profileImage: user.profile_image_url || null,
        metadata: {
          description: user.description,
          verified: user.verified,
          followersCount: user.public_metrics?.followers_count || 0,
        },
      };
    }

    case "instagram": {
      const response = await fetch(
        "https://graph.instagram.com/me?fields=id,username,account_type,media_count",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Instagram profile");
      }

      const data = await response.json();

      return {
        platformUserId: data.id,
        username: data.username,
        displayName: data.username,
        profileImage: null, // Instagram API doesn't provide profile image in basic scope
        metadata: {
          accountType: data.account_type,
          mediaCount: data.media_count,
        },
      };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  platform: SocialPlatform,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
}> {
  const config = getOAuthConfig(platform);

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`OAuth credentials not configured for ${platform}`);
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some platforms don't return new refresh token
    expiresIn: data.expires_in || null,
  };
}
