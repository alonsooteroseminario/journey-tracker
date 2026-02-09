import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { notify } from "@/lib/email/notifications";

const createTemplateSchema = z.object({
  goalId: z.string(),
  lessonsLearned: z.string().optional(),
  tips: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["friends", "public"]).default("friends"),
});

/**
 * GET /api/templates
 * Fetch templates visible to the user (own + friends')
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeOwn = searchParams.get("includeOwn") !== "false";
    const visibility = searchParams.get("visibility") || "all";

    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);

    // Build query conditions
    const conditions: any[] = [];

    // Friends' templates
    if (friendIds.length > 0) {
      conditions.push({
        authorId: { in: friendIds },
        visibility: "friends",
      });
    }

    // Own templates
    if (includeOwn) {
      conditions.push({ authorId: user.id });
    }

    // Public templates
    if (visibility === "public" || visibility === "all") {
      conditions.push({ visibility: "public", isPublished: true });
    }

    if (conditions.length === 0) {
      return NextResponse.json([]);
    }

    const templates = await prisma.goalTemplate.findMany({
      where: {
        OR: conditions,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create a new template from a goal
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTemplateSchema.parse(body);

    // Fetch the goal
    const goal = await prisma.goal.findUnique({
      where: { id: validated.goalId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only share your own goals" },
        { status: 403 }
      );
    }

    // Create template
    const template = await prisma.goalTemplate.create({
      data: {
        authorId: user.id,
        originalGoalId: goal.id,
        title: goal.title,
        description: goal.description || "",
        icon: goal.icon || "🎯",
        tasks: goal.tasks as Prisma.InputJsonValue,
        phases: (goal.phases || []) as Prisma.InputJsonValue,
        timeline: (goal.timeline || {}) as Prisma.InputJsonValue,
        resources: (goal.resources || {}) as Prisma.InputJsonValue,
        lessonsLearned: validated.lessonsLearned || "",
        tips: validated.tips || "",
        estimatedDuration: validated.estimatedDuration || "",
        difficulty: validated.difficulty || "intermediate",
        category: validated.category || "Other",
        tags: validated.tags || [],
        visibility: validated.visibility,
        isPublished: false,
        forkCount: 0,
      },
    });

    // Send notification
    notify(user.id, "goalShared", {
      userName: user.name,
      goalTitle: goal.title,
      goalIcon: goal.icon || undefined,
    }).catch((err) => {
      console.error("Failed to send goal shared email:", err);
    });

    // Create feed item
    prisma.feedItem
      .create({
        data: {
          userId: user.id,
          type: "goal_shared",
          content: `${user.name} shared a goal template: ${goal.icon || "🎯"} ${goal.title}`,
          metadata: { templateId: template.id, goalId: goal.id },
          visibility: validated.visibility,
        },
      })
      .catch((err) => {
        console.error("Failed to create feed item:", err);
      });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
