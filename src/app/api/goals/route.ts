import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateGoalSchema, validateRequest } from "@/lib/validations";
import { pickGoalIcon } from "@/lib/agent/pickGoalIcon";
import type { Task } from "@/types";

// GET /api/goals - Get all goals for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Transform Prisma goals to match the frontend Goal type
    const transformed = goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      icon: goal.icon,
      tasks: (goal.tasks as any[]) || [],
      phases: goal.phases || undefined,
      budget: goal.budget || undefined,
      timeline: goal.timeline || undefined,
      documents: goal.documents || undefined,
      resources: goal.resources || undefined,
      startDate: goal.startDate?.toISOString().split("T")[0],
      targetDate: goal.targetDate?.toISOString().split("T")[0],
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      isPublic: goal.isPublic,
    }));

    return NextResponse.json(transformed, {
      headers: { 'Cache-Control': 'private, no-cache' },
    });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = validateRequest(CreateGoalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;

    // Pick icon via AI if not already provided
    const icon = validatedData.icon || (await pickGoalIcon(validatedData.title, validatedData.description));

    // Normalize tasks to ensure status field is set
    const tasks = (validatedData.tasks || []) as Task[];
    const normalizedTasks = tasks.map((task) => ({
      ...task,
      status: task.status || 'not_started',
      substeps: task.substeps?.map((substep) => ({
        ...substep,
        status: substep.status || 'not_started',
      })) || [],
    }));

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        icon,
        tasks: normalizedTasks,
        phases: validatedData.phases || undefined,
        budget: validatedData.budget || undefined,
        timeline: validatedData.timeline || undefined,
        documents: validatedData.documents || undefined,
        resources: validatedData.resources || undefined,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        isPublic: validatedData.isPublic ?? true,
      },
    });

    return NextResponse.json(
      {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        icon: goal.icon,
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
