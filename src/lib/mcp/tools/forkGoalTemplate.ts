import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ToolDefinition } from "@/types/agent";
import { resolveUser } from "@/lib/agent/resolveUser";
import { notify } from "@/lib/email/notifications";
import type { Task } from "@/types";

export const toolDefinition: ToolDefinition = {
  name: "fork-goal-template",
  description:
    "Fork (clone) a goal template into a new goal for yourself. Creates a fresh copy with all tasks reset to incomplete.",
  input_schema: {
    type: "object",
    properties: {
      templateId: {
        type: "string",
        description: "The ID of the template to fork",
      },
      customTitle: {
        type: "string",
        description: "Optional custom title for the new goal",
      },
    },
    required: ["templateId"],
  },
};

const forkGoalTemplateSchema = z.object({
  templateId: z.string(),
  customTitle: z.string().optional(),
});

function resetTasksCompletion(tasks: Task[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    completed: false,
    completedAt: undefined,
    substeps: task.substeps
      ? task.substeps.map((substep) => ({
          ...substep,
          completed: false,
          completedAt: undefined,
        }))
      : [],
  }));
}

export async function executeForkGoalTemplate(args: unknown, userId?: string) {
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

    const parsed = forkGoalTemplateSchema.parse(args);

    // Fetch template
    const template = await prisma.goalTemplate.findUnique({
      where: { id: parsed.templateId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      return {
        success: false,
        error: "Not found",
        message: "Template not found",
      };
    }

    // Verify access (must be public or from a friend or own template)
    if (template.visibility === "friends" && template.authorId !== user.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: user.id, friendId: template.authorId },
            { userId: template.authorId, friendId: user.id },
          ],
        },
      });

      if (!friendship) {
        return {
          success: false,
          error: "Forbidden",
          message: "You don't have access to this template",
        };
      }
    }

    // Reset all completion status in tasks
    const cleanTasks = resetTasksCompletion(
      (template.tasks as unknown as Task[]) || []
    );

    // Create new goal from template
    const newGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: parsed.customTitle || template.title,
        description: template.description,
        icon: template.icon,
        tasks: cleanTasks as unknown as Prisma.InputJsonValue,
        phases: template.phases || [],
        timeline: template.timeline || {},
        resources: template.resources || {},
        isPublic: true,
      },
    });

    // Create fork record
    await prisma.goalFork.create({
      data: {
        templateId: template.id,
        userId: user.id,
        newGoalId: newGoal.id,
      },
    });

    // Increment fork count
    await prisma.goalTemplate.update({
      where: { id: template.id },
      data: { forkCount: { increment: 1 } },
    });

    // Notify template author (if not forking own template)
    if (template.authorId !== user.id) {
      notify(template.authorId, "goalForked", {
        userName: template.author.name,
        goalTitle: template.title,
        goalIcon: template.icon || undefined,
        forkerName: user.name,
        totalForks: template.forkCount + 1,
      }).catch((err) => {
        console.error("Failed to send goal forked email:", err);
      });

      // Create feed item for author
      prisma.feedItem
        .create({
          data: {
            userId: template.authorId,
            type: "goal_forked",
            content: `${user.name} forked your template: ${template.icon} ${template.title}`,
            metadata: {
              templateId: template.id,
              forkedByUserId: user.id,
              newGoalId: newGoal.id,
            },
            visibility: "friends",
          },
        })
        .catch((err) => {
          console.error("Failed to create feed item:", err);
        });
    }

    return {
      success: true,
      data: {
        goalId: newGoal.id,
        title: newGoal.title,
        taskCount: cleanTasks.length,
      },
      message: `Forked template into new goal: ${newGoal.title}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        message: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Error in executeForkGoalTemplate:", error);
    return {
      success: false,
      error: "Database error",
      message: "Failed to fork template",
    };
  }
}
