import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFeedItemSchema = z.object({
  type: z.enum([
    "streak_milestone",
    "goal_created",
    "task_completed",
    "goal_shared",
    "goal_published",
    "goal_forked",
    "streak_at_risk",
  ]),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  visibility: z.enum(["friends", "public"]).default("friends"),
});

/**
 * GET /api/feed
 * Fetch feed items from friends and self
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);
    const userIds = [user.id, ...friendIds];

    // Fetch feed items from self and friends
    const feedItems = await prisma.feedItem.findMany({
      where: {
        userId: { in: userIds },
        OR: [
          { visibility: "public" },
          { userId: user.id }, // Always show own items
          {
            AND: [
              { visibility: "friends" },
              { userId: { in: friendIds } },
            ],
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
      skip: offset,
      take: limit,
    });

    // Transform to include cheer status for current user
    const transformedItems = feedItems.map((item) => ({
      ...item,
      userName: item.user.name,
      userImage: item.user.profileImage,
      cheerCount: item.cheers.length,
      hasCheered: item.cheers.some((cheer) => cheer.userId === user.id),
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed
 * Create a new feed item manually
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createFeedItemSchema.parse(body);

    const feedItem = await prisma.feedItem.create({
      data: {
        userId: user.id,
        type: validated.type,
        content: validated.content,
        metadata: validated.metadata || {},
        visibility: validated.visibility,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...feedItem,
      userName: feedItem.user.name,
      userImage: feedItem.user.profileImage,
      cheerCount: 0,
      hasCheered: false,
      comments: [],
      cheers: [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create feed item:", error);
    return NextResponse.json(
      { error: "Failed to create feed item" },
      { status: 500 }
    );
  }
}
