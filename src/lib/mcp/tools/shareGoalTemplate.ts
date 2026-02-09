import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ToolDefinition } from "@/types/agent";
import { resolveUser } from "@/lib/agent/resolveUser";
import { securityGuard } from "@/lib/agent/security";
import { notify } from "@/lib/email/notifications";

export const toolDefinition: ToolDefinition = {
  name: "share-goal-template",
  description:
    "Create a shareable template from an existing goal. Snapshots the goal's structure, tasks, and metadata for others to use.",
  input_schema: {
    type: "object",
    properties: {
      goalId: {
        type: "string",
        description: "The ID of the goal to share as a template",
      },
      lessonsLearned: {
        type: "string",
        description: "What you learned while working on this goal (optional)",
      },
      tips: {
        type: "string",
        description: "Tips and advice for others using this template (optional)",
      },
      estimatedDuration: {
        type: "string",
        description:
          "How long it typically takes (e.g., '3 months', '6 weeks') (optional)",
      },
      difficulty: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced"],
        description: "Difficulty level (optional)",
      },
      category: {
        type: "string",
        description:
          "Category (e.g., 'Career', 'Health', 'Education', 'Immigration', 'Finance') (optional)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags for searchability (optional)",
      },
      visibility: {
        type: "string",
        enum: ["friends", "public"],
        description: "Who can see this template (default: friends)",
        default: "friends",
      },
    },
    required: ["goalId"],
  },
};

const shareGoalTemplateSchema = z.object({
  goalId: z.string(),
  lessonsLearned: z.string().optional(),
  tips: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["friends", "public"]).default("friends"),
});

export async function executeShareGoalTemplate(
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

    const parsed = shareGoalTemplateSchema.parse(args);
    parsed.goalId = parsed.goalId.replace(/^goal_/i, "");

    // Verify ownership
    const hasAccess = await securityGuard.verifyOwnership(
      parsed.goalId,
      user.id,
      "goal"
    );
    if (!hasAccess) {
      return {
        success: false,
        error: "Forbidden",
        message: "You don't have access to this goal",
      };
    }

    // Fetch the goal with all data
    const goal = await prisma.goal.findUnique({
      where: { id: parsed.goalId },
    });

    if (!goal) {
      return {
        success: false,
        error: "Not found",
        message: "Goal not found",
      };
    }

    // Create template snapshot
    const template = await prisma.goalTemplate.create({
      data: {
        authorId: user.id,
        originalGoalId: goal.id,
        title: goal.title,
        description: goal.description || "",
        icon: goal.icon || "🎯",
        tasks: goal.tasks as Prisma.InputJsonValue,
        phases: (goal.phases || []) as Prisma.InputJsonValue,
        timeline: (goal.timeline || {}) as Prisma.InputJsonValue,
        resources: (goal.resources || {}) as Prisma.InputJsonValue,
        lessonsLearned: parsed.lessonsLearned || "",
        tips: parsed.tips || "",
        estimatedDuration: parsed.estimatedDuration || "",
        difficulty: parsed.difficulty || "intermediate",
        category: parsed.category || "Other",
        tags: parsed.tags || [],
        visibility: parsed.visibility,
        isPublished: false,
        forkCount: 0,
      },
    });

    // Send notification
    notify(user.id, "goalShared", {
      userName: user.name,
      goalTitle: goal.title,
      goalIcon: goal.icon || undefined,
    }).catch((err) => {
      console.error("Failed to send goal shared email:", err);
    });

    // Create feed item
    prisma.feedItem
      .create({
        data: {
          userId: user.id,
          type: "goal_shared",
          content: `${user.name} shared a goal template: ${goal.icon || "🎯"} ${goal.title}`,
          metadata: { templateId: template.id, goalId: goal.id },
          visibility: parsed.visibility,
        },
      })
      .catch((err) => {
        console.error("Failed to create feed item:", err);
      });

    return {
      success: true,
      data: {
        id: template.id,
        title: template.title,
        visibility: template.visibility,
      },
      message: `Shared template: ${template.title}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        message: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Error in executeShareGoalTemplate:", error);
    return {
      success: false,
      error: "Database error",
      message: "Failed to create template",
    };
  }
}
