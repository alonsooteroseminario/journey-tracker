import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/groups/:groupId - Update a group
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.goalGroup.findUnique({ where: { id: groupId } });
    if (!group || group.userId !== user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.order !== undefined) updates.order = body.order;

    const updated = await prisma.goalGroup.update({
      where: { id: groupId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/groups/:groupId error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/:groupId - Delete a group
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.goalGroup.findUnique({ where: { id: groupId } });
    if (!group || group.userId !== user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Unset groupId on all goals in this group
    await prisma.goal.updateMany({
      where: { groupId },
      data: { groupId: null },
    });

    await prisma.goalGroup.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/groups/:groupId error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
