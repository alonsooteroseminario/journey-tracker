import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";

export const toolDefinition: ToolDefinition = {
  name: "add-feed-comment",
  description:
    "Add a comment to a feed item. Use this to respond to friends' activity or leave encouraging messages.",
  input_schema: {
    type: "object",
    properties: {
      feedItemId: {
        type: "string",
        description: "The ID of the feed item to comment on",
      },
      content: {
        type: "string",
        description: "The comment text (max 500 characters)",
      },
    },
    required: ["feedItemId", "content"],
  },
};

const addFeedCommentSchema = z.object({
  feedItemId: z.string(),
  content: z.string().min(1).max(500),
});

export async function executeAddFeedComment(args: unknown, userId: string) {
  const parsed = addFeedCommentSchema.parse(args);

  // Verify feed item exists
  const feedItem = await prisma.feedItem.findUnique({
    where: { id: parsed.feedItemId },
  });

  if (!feedItem) {
    throw new Error("Feed item not found");
  }

  const comment = await prisma.feedComment.create({
    data: {
      feedItemId: parsed.feedItemId,
      userId,
      content: parsed.content,
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

  return {
    success: true,
    comment: {
      ...comment,
      userName: comment.user.name,
      userImage: comment.user.profileImage,
    },
  };
}
