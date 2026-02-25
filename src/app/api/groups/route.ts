import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/groups - Get all groups for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.goalGroup.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, icon } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const count = await prisma.goalGroup.count({ where: { userId: user.id } });

    const group = await prisma.goalGroup.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || "#6366f1",
        icon: icon || undefined,
        order: count,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
