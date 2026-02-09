import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cheerSchema = z.object({
  emoji: z.string().default("🎉"),
});

/**
 * POST /api/feed/[feedItemId]/cheers
 * Toggle cheer on a feed item (add if not present, remove if present)
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
    const validated = cheerSchema.parse(body);

    // Check if user already cheered
    const existingCheer = await prisma.feedCheer.findUnique({
      where: {
        feedItemId_userId: {
          feedItemId,
          userId: user.id,
        },
      },
    });

    if (existingCheer) {
      // Remove cheer (uncheer)
      await prisma.feedCheer.delete({
        where: { id: existingCheer.id },
      });

      return NextResponse.json({
        action: "removed",
        message: "Cheer removed",
      });
    } else {
      // Add cheer
      const cheer = await prisma.feedCheer.create({
        data: {
          feedItemId,
          userId: user.id,
          emoji: validated.emoji,
        },
      });

      return NextResponse.json({
        action: "added",
        message: "Cheer added",
        cheer,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to toggle cheer:", error);
    return NextResponse.json(
      { error: "Failed to toggle cheer" },
      { status: 500 }
    );
  }
}
