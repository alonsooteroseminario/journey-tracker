import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/goals/reorder — batch-update goal ordering
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { goalIds } = body as { goalIds: string[] };

    if (!Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: "goalIds must be a non-empty array" }, { status: 400 });
    }

    // Verify all goals belong to the user
    const goals = await prisma.goal.findMany({
      where: { id: { in: goalIds }, userId: user.id },
      select: { id: true },
    });

    if (goals.length !== goalIds.length) {
      return NextResponse.json({ error: "Some goals not found or unauthorized" }, { status: 403 });
    }

    // Update each goal's order
    await Promise.all(
      goalIds.map((id, index) =>
        prisma.goal.update({ where: { id }, data: { order: index } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/goals/reorder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
