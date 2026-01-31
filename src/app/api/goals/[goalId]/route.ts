import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UpdateGoalSchema, validateRequest } from "@/lib/validations";

// GET /api/goals/:goalId
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      tasks: goal.tasks,
      phases: goal.phases,
      budget: goal.budget,
      timeline: goal.timeline,
      documents: goal.documents,
      resources: goal.resources,
      startDate: goal.startDate?.toISOString().split("T")[0],
      targetDate: goal.targetDate?.toISOString().split("T")[0],
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/goals/:id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/:goalId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;

    // Verify ownership BEFORE updating
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate request body
    const validation = validateRequest(UpdateGoalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;

    // Build update data, only including fields that are present
    const updateData: Record<string, unknown> = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.tasks !== undefined) updateData.tasks = validatedData.tasks;
    if (validatedData.phases !== undefined) updateData.phases = validatedData.phases;
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget;
    if (validatedData.timeline !== undefined) updateData.timeline = validatedData.timeline;
    if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
    if (validatedData.resources !== undefined) updateData.resources = validatedData.resources;
    if (validatedData.startDate !== undefined)
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    if (validatedData.targetDate !== undefined)
      updateData.targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return NextResponse.json({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      tasks: goal.tasks,
      startDate: goal.startDate?.toISOString().split("T")[0],
      targetDate: goal.targetDate?.toISOString().split("T")[0],
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/goals/:id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/:goalId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await params;

    // Verify ownership before delete
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.goal.delete({ where: { id: goalId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals/:id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
