import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { notify } from "@/lib/email/notifications";
import type { Task } from "@/types";

const respondSchema = z.object({
  status: z.enum(["approved", "rejected"]),
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

/**
 * PATCH /api/fork-requests/[requestId]
 * Approve or reject a fork request (template author only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const validated = respondSchema.parse(body);

    // Fetch the fork request with template
    const forkRequest = await prisma.forkRequest.findUnique({
      where: { id: requestId },
      include: {
        template: {
          include: {
            author: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
      },
    });

    if (!forkRequest) {
      return NextResponse.json({ error: "Fork request not found" }, { status: 404 });
    }

    // Only the template author can respond
    if (forkRequest.template.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (forkRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been responded to" },
        { status: 400 }
      );
    }

    // Update request status
    const updated = await prisma.forkRequest.update({
      where: { id: requestId },
      data: { status: validated.status },
    });

    // If approved, auto-fork the template
    if (validated.status === "approved") {
      const template = forkRequest.template;
      const cleanTasks = resetTasksCompletion(
        (template.tasks as unknown as Task[]) || []
      );

      const newGoal = await prisma.goal.create({
        data: {
          userId: forkRequest.requesterId,
          title: template.title,
          description: template.description,
          icon: template.icon,
          tasks: cleanTasks as unknown as Prisma.InputJsonValue,
          phases: template.phases || [],
          timeline: template.timeline || {},
          resources: template.resources || {},
          isPublic: true,
        },
      });

      await prisma.goalFork.create({
        data: {
          templateId: template.id,
          userId: forkRequest.requesterId,
          newGoalId: newGoal.id,
        },
      });

      await prisma.goalTemplate.update({
        where: { id: template.id },
        data: { forkCount: { increment: 1 } },
      });

      // Create feed item
      prisma.feedItem
        .create({
          data: {
            userId: template.authorId,
            type: "goal_forked",
            content: `${forkRequest.requester.name} forked your template: ${template.icon} ${template.title}`,
            metadata: {
              templateId: template.id,
              forkedByUserId: forkRequest.requesterId,
              newGoalId: newGoal.id,
            },
            visibility: "friends",
          },
        })
        .catch((err) => {
          console.error("Failed to create feed item:", err);
        });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to respond to fork request:", error);
    return NextResponse.json(
      { error: "Failed to respond to fork request" },
      { status: 500 }
    );
  }
}
