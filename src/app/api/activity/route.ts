import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateActivityLogSchema, PaginationSchema, validateRequest } from "@/lib/validations";

// GET /api/activity - Get activity log
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Validate pagination params
    const paginationValidation = validateRequest(PaginationSchema, {
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    
    if (!paginationValidation.success) {
      return NextResponse.json({ error: paginationValidation.error }, { status: 400 });
    }

    const { limit, offset } = paginationValidation.data;

    const activities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(
      activities.map((a) => ({
        id: a.id,
        date: a.timestamp.toISOString(),
        type: a.type,
        goalId: a.goalId || "",
        taskId: a.taskId,
        substepId: a.substepId,
        description: a.action,
        metadata: a.metadata,
      })),
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/activity - Log a new activity
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = validateRequest(CreateActivityLogSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;

    const activity = await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        action: validatedData.description,
        goalId: validatedData.goalId,
        taskId: validatedData.taskId,
        substepId: validatedData.substepId,
        metadata: validatedData.metadata as any, // Prisma JSON type compatibility
      },
    });

    return NextResponse.json(
      {
        id: activity.id,
        date: activity.timestamp.toISOString(),
        type: activity.type,
        goalId: activity.goalId || "",
        taskId: activity.taskId,
        substepId: activity.substepId,
        description: activity.action,
        metadata: activity.metadata,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
