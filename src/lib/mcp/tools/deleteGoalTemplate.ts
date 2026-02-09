import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/types/agent";
import { resolveUser } from "@/lib/agent/resolveUser";
import { notify } from "@/lib/email/notifications";

export const toolDefinition: ToolDefinition = {
  name: "delete-goal-template",
  description:
    "Delete a goal template. You can only delete your own templates.",
  input_schema: {
    type: "object",
    properties: {
      templateId: {
        type: "string",
        description: "The ID of the template to delete",
      },
    },
    required: ["templateId"],
  },
};

const deleteGoalTemplateSchema = z.object({
  templateId: z.string(),
});

export async function executeDeleteGoalTemplate(
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

    const parsed = deleteGoalTemplateSchema.parse(args);

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
        message: "You can only delete your own templates",
      };
    }

    // Delete the template (cascade will delete forks)
    await prisma.goalTemplate.delete({
      where: { id: parsed.templateId },
    });

    // Send notification
    notify(user.id, "goalShared", {
      userName: user.name,
      goalTitle: `Unshared: ${template.title}`,
      goalIcon: template.icon || undefined,
    }).catch((err) => {
      console.error("Failed to send template deleted email:", err);
    });

    return {
      success: true,
      message: `Deleted template: ${template.title}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        message: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Error in executeDeleteGoalTemplate:", error);
    return {
      success: false,
      error: "Database error",
      message: "Failed to delete template",
    };
  }
}
