import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AddFriendSchema, validateRequest } from "@/lib/validations";

// GET /api/friends - Get all friends with their stats
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all friendships where user is either party
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: user.id }, { friendId: user.id }],
        status: "accepted",
      },
      include: {
        user: true,
        friend: true,
      },
    });

    // Build friend list with stats
    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        // Determine which user is the friend (not "us")
        const friendUser =
          friendship.userId === user.id ? friendship.friend : friendship.user;

        // Get friend's streak data
        const streakData = await prisma.streakData.findUnique({
          where: { userId: friendUser.id },
        });

        // Get friend's goal count
        const goals = await prisma.goal.findMany({
          where: { userId: friendUser.id, isPublic: true },
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter((g) => {
          const tasks = (g.tasks as any[]) || [];
          return tasks.length > 0 && tasks.every((t: any) => t.completed);
        }).length;

        return {
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
        };
      })
    );

    return NextResponse.json(friends);
  } catch (error) {
    console.error("GET /api/friends error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/friends - Add friend via invitation code
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = validateRequest(AddFriendSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { code } = validation.data;

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { code },
      include: { user: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 404 }
      );
    }

    if (invitation.used) {
      return NextResponse.json(
        { error: "Invitation already used" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 400 }
      );
    }

    if (invitation.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as friend" },
        { status: 400 }
      );
    }

    // Check if already friends
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: invitation.userId },
          { userId: invitation.userId, friendId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already friends" },
        { status: 400 }
      );
    }

    // Create bidirectional friendship
    await prisma.friendship.createMany({
      data: [
        {
          userId: user.id,
          friendId: invitation.userId,
          status: "accepted",
        },
        {
          userId: invitation.userId,
          friendId: user.id,
          status: "accepted",
        },
      ],
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        used: true,
        usedBy: user.clerkId,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, friendName: invitation.user.name });
  } catch (error) {
    console.error("POST /api/friends error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
