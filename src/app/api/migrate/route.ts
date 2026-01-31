import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MigrateDataSchema, validateRequest } from "@/lib/validations";

// POST /api/migrate - Migrate localStorage data to MongoDB
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate migration data structure
    const validation = validateRequest(MigrateDataSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { goals, profile, streak, activityLog } = validation.data;

    // 1. Migrate goals
    if (goals && Array.isArray(goals) && goals.length > 0) {
      // Check if user already has goals (avoid duplicate migration)
      const existingGoals = await prisma.goal.count({
        where: { userId: user.id },
      });

      if (existingGoals === 0) {
        for (const goal of goals) {
          await prisma.goal.create({
            data: {
              userId: user.id,
              title: goal.title,
              description: goal.description || null,
              tasks: goal.tasks || [],
              phases: goal.phases || undefined,
              budget: goal.budget || undefined,
              timeline: goal.timeline || undefined,
              documents: goal.documents || undefined,
              resources: goal.resources || undefined,
              startDate: goal.startDate ? new Date(goal.startDate) : null,
              targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
            },
          });
        }
      }
    }

    // 2. Update profile data
    if (profile) {
      const updateData: Record<string, unknown> = {};
      if (profile.name) updateData.name = profile.name;
      if (profile.bio) updateData.bio = profile.bio;
      if (profile.location) updateData.location = profile.location;
      if (profile.timezone) updateData.timezone = profile.timezone;
      if (profile.profileImage) updateData.profileImage = profile.profileImage;

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // 3. Migrate streak data
    if (streak) {
      await prisma.streakData.upsert({
        where: { userId: user.id },
        update: {
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || 0,
          lastActivityDate: streak.lastActivityDate
            ? new Date(streak.lastActivityDate)
            : null,
          streakHistory: streak.streakHistory || [],
        },
        create: {
          userId: user.id,
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || 0,
          lastActivityDate: streak.lastActivityDate
            ? new Date(streak.lastActivityDate)
            : null,
          streakHistory: streak.streakHistory || [],
        },
      });
    }

    // 4. Migrate activity log
    if (activityLog && Array.isArray(activityLog) && activityLog.length > 0) {
      const existingActivities = await prisma.activityLog.count({
        where: { userId: user.id },
      });

      if (existingActivities === 0) {
        for (const activity of activityLog) {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              type: activity.type,
              action: activity.description || activity.action || "",
              goalId: activity.goalId,
              taskId: activity.taskId,
              substepId: activity.substepId,
              metadata: activity.metadata,
              timestamp: activity.date
                ? new Date(activity.date)
                : new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data migrated successfully",
    });
  } catch (error) {
    console.error("POST /api/migrate error:", error);
    return NextResponse.json(
      { error: "Migration failed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
