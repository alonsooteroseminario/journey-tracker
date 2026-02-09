import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";

export const toolDefinition: ToolDefinition = {
  name: "get-feed",
  description:
    "Get feed items from friends and self. Returns recent activity like goal creation, task completion, streak milestones, and goal sharing.",
  input_schema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of items to fetch (max 100)",
        default: 20,
      },
      offset: {
        type: "number",
        description: "Number of items to skip for pagination",
        default: 0,
      },
    },
  },
};

const getFeedSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function executeGetFeed(args: unknown, userId: string) {
  const parsed = getFeedSchema.parse(args);

  // Get user's friends
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });

  const friendIds = friendships.map((f) => f.friendId);
  const userIds = [userId, ...friendIds];

  // Fetch feed items from self and friends
  const feedItems = await prisma.feedItem.findMany({
    where: {
      userId: { in: userIds },
      OR: [
        { visibility: "public" },
        { userId }, // Always show own items
        {
          AND: [{ visibility: "friends" }, { userId: { in: friendIds } }],
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      cheers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: parsed.offset,
    take: parsed.limit,
  });

  // Transform to include cheer status for current user
  const transformedItems = feedItems.map((item) => ({
    ...item,
    userName: item.user.name,
    userImage: item.user.profileImage,
    cheerCount: item.cheers.length,
    hasCheered: item.cheers.some((cheer) => cheer.userId === userId),
  }));

  return {
    success: true,
    feedItems: transformedItems,
    total: transformedItems.length,
  };
}
