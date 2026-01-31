import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/friends/:friendId - Get detailed friend profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await params;

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
        status: "accepted",
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend not found" },
        { status: 404 }
      );
    }

    const friendUser = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friendUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get friend's streak data
    const streakData = await prisma.streakData.findUnique({
      where: { userId: friendUser.id },
    });

    // Get friend's public goals (full transparency)
    const goals = await prisma.goal.findMany({
      where: { userId: friendUser.id, isPublic: true },
      orderBy: { createdAt: "desc" },
    });

    const transformedGoals = goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      tasks: goal.tasks,
      startDate: goal.startDate?.toISOString().split("T")[0],
      targetDate: goal.targetDate?.toISOString().split("T")[0],
      createdAt: goal.createdAt.toISOString(),
    }));

    // Get friend's recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { userId: friendUser.id },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => {
      const tasks = (g.tasks as any[]) || [];
      return tasks.length > 0 && tasks.every((t: any) => t.completed);
    }).length;

    return NextResponse.json({
      id: friendUser.id,
      clerkId: friendUser.clerkId,
      name: friendUser.name,
      email: friendUser.email,
      profileImage: friendUser.profileImage,
      bio: friendUser.bio,
      location: friendUser.location,
      joinedDate: friendUser.joinedDate.toISOString().split("T")[0],
      friendshipId: friendship.id,
      addedDate: friendship.addedDate.toISOString().split("T")[0],
      status: friendship.status,
      currentStreak: streakData?.currentStreak ?? 0,
      longestStreak: streakData?.longestStreak ?? 0,
      totalGoals,
      completedGoals,
      goals: transformedGoals,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        action: a.action,
        timestamp: a.timestamp.toISOString(),
        goalId: a.goalId,
        taskId: a.taskId,
        metadata: a.metadata,
      })),
    });
  } catch (error) {
    console.error("GET /api/friends/:id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/friends/:friendId - Remove friend
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await params;

    // Remove both sides of the friendship
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/friends/:id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
