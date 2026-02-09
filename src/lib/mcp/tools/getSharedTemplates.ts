import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";
import { resolveUser } from "@/lib/agent/resolveUser";

export const toolDefinition: ToolDefinition = {
  name: "get-shared-templates",
  description:
    "Get goal templates that are shared with you. Includes your own templates and templates from friends.",
  input_schema: {
    type: "object",
    properties: {
      includeOwn: {
        type: "boolean",
        description: "Include your own templates (default: true)",
        default: true,
      },
      visibility: {
        type: "string",
        enum: ["friends", "public", "all"],
        description: "Filter by visibility (default: all)",
        default: "all",
      },
    },
  },
};

const getSharedTemplatesSchema = z.object({
  includeOwn: z.boolean().default(true),
  visibility: z.enum(["friends", "public", "all"]).default("all"),
});

export async function executeGetSharedTemplates(
  args: unknown,
  userId?: string
) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
        message: "User ID is required",
      };
    }

    const user = await resolveUser(userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
        message: "Could not find user in database",
      };
    }

    const parsed = getSharedTemplatesSchema.parse(args);

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);

    // Build query conditions
    const conditions: any[] = [];

    // Friends' templates
    if (friendIds.length > 0) {
      conditions.push({
        authorId: { in: friendIds },
        visibility: "friends",
      });
    }

    // Own templates
    if (parsed.includeOwn) {
      conditions.push({ authorId: user.id });
    }

    // Public templates
    if (parsed.visibility === "public" || parsed.visibility === "all") {
      conditions.push({ visibility: "public", isPublished: true });
    }

    if (conditions.length === 0) {
      return {
        success: true,
        data: [],
        message: "No templates found",
      };
    }

    const templates = await prisma.goalTemplate.findMany({
      where: {
        OR: conditions,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        icon: t.icon,
        authorId: t.authorId,
        authorName: t.author.name,
        difficulty: t.difficulty,
        category: t.category,
        tags: t.tags,
        forkCount: t.forkCount,
        visibility: t.visibility,
        isPublished: t.isPublished,
        createdAt: t.createdAt,
      })),
      message: `Found ${templates.length} template(s)`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        message: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Error in executeGetSharedTemplates:", error);
    return {
      success: false,
      error: "Database error",
      message: "Failed to fetch templates",
    };
  }
}
