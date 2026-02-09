import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";

export const toolDefinition: ToolDefinition = {
  name: "toggle-feed-cheer",
  description:
    "Toggle a cheer (reaction) on a feed item. If you haven't cheered it yet, this will add a cheer. If you already cheered it, this will remove your cheer.",
  input_schema: {
    type: "object",
    properties: {
      feedItemId: {
        type: "string",
        description: "The ID of the feed item to cheer/uncheer",
      },
      emoji: {
        type: "string",
        description: "The emoji to use for the cheer (default: 🎉)",
        default: "🎉",
      },
    },
    required: ["feedItemId"],
  },
};

const toggleFeedCheerSchema = z.object({
  feedItemId: z.string(),
  emoji: z.string().default("🎉"),
});

export async function executeToggleFeedCheer(args: unknown, userId: string) {
  const parsed = toggleFeedCheerSchema.parse(args);

  // Check if user already cheered
  const existingCheer = await prisma.feedCheer.findUnique({
    where: {
      feedItemId_userId: {
        feedItemId: parsed.feedItemId,
        userId,
      },
    },
  });

  if (existingCheer) {
    // Remove cheer (uncheer)
    await prisma.feedCheer.delete({
      where: { id: existingCheer.id },
    });

    return {
      success: true,
      action: "removed",
      message: "Cheer removed",
    };
  } else {
    // Add cheer
    const cheer = await prisma.feedCheer.create({
      data: {
        feedItemId: parsed.feedItemId,
        userId,
        emoji: parsed.emoji,
      },
    });

    return {
      success: true,
      action: "added",
      message: "Cheer added",
      cheer,
    };
  }
}
