import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UpdateTaskSchema, validateRequest } from "@/lib/validations";

// PATCH /api/goals/:goalId/tasks/:taskId - Update a single task within a goal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId, taskId } = await params;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate request body (blocks 'id' override attacks)
    const validation = validateRequest(UpdateTaskSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;
    const tasks = (goal.tasks as any[]) || [];

    // Find and update the specific task
    let taskFound = false;
    const updatedTasks = tasks.map((task: any) => {
      if (task.id !== taskId) return task;
      taskFound = true;
      return { ...task, ...validatedData };
    });

    if (!taskFound) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { tasks: updatedTasks },
    });

    return NextResponse.json({
      id: updatedGoal.id,
      title: updatedGoal.title,
      tasks: updatedGoal.tasks,
      updatedAt: updatedGoal.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/goals/:id/tasks/:taskId error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
