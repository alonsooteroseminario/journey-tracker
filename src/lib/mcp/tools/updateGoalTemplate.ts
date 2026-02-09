import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";
import { resolveUser } from "@/lib/agent/resolveUser";

export const toolDefinition: ToolDefinition = {
  name: "update-goal-template",
  description:
    "Update a goal template's metadata like lessons learned, tips, difficulty, or category.",
  input_schema: {
    type: "object",
    properties: {
      templateId: {
        type: "string",
        description: "The ID of the template to update",
      },
      lessonsLearned: {
        type: "string",
        description: "Updated lessons learned",
      },
      tips: {
        type: "string",
        description: "Updated tips",
      },
      estimatedDuration: {
        type: "string",
        description: "Updated estimated duration",
      },
      difficulty: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced"],
        description: "Updated difficulty level",
      },
      category: {
        type: "string",
        description: "Updated category",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Updated tags",
      },
    },
    required: ["templateId"],
  },
};

const updateGoalTemplateSchema = z.object({
  templateId: z.string(),
  lessonsLearned: z.string().optional(),
  tips: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function executeUpdateGoalTemplate(
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

    const parsed = updateGoalTemplateSchema.parse(args);

    // Verify template exists and user is the author
    const template = await prisma.goalTemplate.findUnique({
      where: { id: parsed.templateId },
    });

    if (!template) {
      return {
        success: false,
        error: "Not found",
        message: "Template not found",
      };
    }

    if (template.authorId !== user.id) {
      return {
        success: false,
        error: "Forbidden",
        message: "You can only update your own templates",
      };
    }

    // Build update data
    const updateData: Record<string, any> = {};
    if (parsed.lessonsLearned !== undefined)
      updateData.lessonsLearned = parsed.lessonsLearned;
    if (parsed.tips !== undefined) updateData.tips = parsed.tips;
    if (parsed.estimatedDuration !== undefined)
      updateData.estimatedDuration = parsed.estimatedDuration;
    if (parsed.difficulty !== undefined)
      updateData.difficulty = parsed.difficulty;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.tags !== undefined) updateData.tags = parsed.tags;

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: "Validation error",
        message: "No fields to update",
      };
    }

    const updated = await prisma.goalTemplate.update({
      where: { id: parsed.templateId },
      data: updateData,
    });

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
      },
      message: `Updated template: ${updated.title}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        message: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Error in executeUpdateGoalTemplate:", error);
    return {
      success: false,
      error: "Database error",
      message: "Failed to update template",
    };
  }
}
