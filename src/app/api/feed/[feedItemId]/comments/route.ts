import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

/**
 * GET /api/feed/[feedItemId]/comments
 * Fetch comments for a feed item
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ feedItemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feedItemId } = await params;
    const comments = await prisma.feedComment.findMany({
      where: { feedItemId },
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
    });

    const transformed = comments.map((comment) => ({
      ...comment,
      userName: comment.user.name,
      userImage: comment.user.profileImage,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/[feedItemId]/comments
 * Add a comment to a feed item
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ feedItemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feedItemId } = await params;
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Verify feed item exists
    const feedItem = await prisma.feedItem.findUnique({
      where: { id: feedItemId },
    });

    if (!feedItem) {
      return NextResponse.json(
        { error: "Feed item not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.feedComment.create({
      data: {
        feedItemId,
        userId: user.id,
        content: validated.content,
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
      ...comment,
      userName: comment.user.name,
      userImage: comment.user.profileImage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
