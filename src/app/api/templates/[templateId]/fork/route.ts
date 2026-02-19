import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { notify } from "@/lib/email/notifications";
import type { Task } from "@/types";

const forkTemplateSchema = z.object({
  customTitle: z.string().optional(),
});

function resetTasksCompletion(tasks: Task[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    status: 'not_started' as const,
    startedAt: undefined,
    completedAt: undefined,
    substeps: task.substeps
      ? task.substeps.map((substep) => ({
          ...substep,
          status: 'not_started' as const,
          startedAt: undefined,
          completedAt: undefined,
        }))
      : [],
  }));
}

/**
 * POST /api/templates/[templateId]/fork
 * Fork a template into a new goal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const body = await request.json();
    const validated = forkTemplateSchema.parse(body);

    // Fetch template
    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
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
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Verify access
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
        return NextResponse.json(
          { error: "You don't have access to this template" },
          { status: 403 }
        );
      }
    }

    // Reset completion status
    const cleanTasks = resetTasksCompletion(
      (template.tasks as unknown as Task[]) || []
    );

    // Create new goal
    const newGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: validated.customTitle || template.title,
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

      // Create feed item
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

    return NextResponse.json({
      goalId: newGoal.id,
      title: newGoal.title,
      taskCount: cleanTasks.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to fork template:", error);
    return NextResponse.json(
      { error: "Failed to fork template" },
      { status: 500 }
    );
  }
}
