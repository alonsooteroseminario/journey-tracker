import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  goalEvents: z.boolean().optional(),
  taskEvents: z.boolean().optional(),
  substepEvents: z.boolean().optional(),
  costEvents: z.boolean().optional(),
  noteEvents: z.boolean().optional(),
  profileEvents: z.boolean().optional(),
  socialEvents: z.boolean().optional(),
  streakEvents: z.boolean().optional(),
});

/**
 * GET /api/feed-preferences
 * Get current user's feed visibility preferences
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch or create default preferences
    let preferences = await prisma.feedPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      // Create default preferences (all enabled)
      preferences = await prisma.feedPreferences.create({
        data: {
          userId: user.id,
          goalEvents: true,
          taskEvents: true,
          substepEvents: true,
          costEvents: true,
          noteEvents: true,
          profileEvents: true,
          socialEvents: true,
          streakEvents: true,
        },
      });
    }

    return NextResponse.json({
      id: preferences.id,
      goalEvents: preferences.goalEvents,
      taskEvents: preferences.taskEvents,
      substepEvents: preferences.substepEvents,
      costEvents: preferences.costEvents,
      noteEvents: preferences.noteEvents,
      profileEvents: preferences.profileEvents,
      socialEvents: preferences.socialEvents,
      streakEvents: preferences.streakEvents,
    });
  } catch (error) {
    console.error("GET /api/feed-preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feed-preferences
 * Update current user's feed visibility preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validated = updatePreferencesSchema.parse(body);

    // Build update data
    const updateData: Record<string, boolean> = {};
    if (validated.goalEvents !== undefined) updateData.goalEvents = validated.goalEvents;
    if (validated.taskEvents !== undefined) updateData.taskEvents = validated.taskEvents;
    if (validated.substepEvents !== undefined) updateData.substepEvents = validated.substepEvents;
    if (validated.costEvents !== undefined) updateData.costEvents = validated.costEvents;
    if (validated.noteEvents !== undefined) updateData.noteEvents = validated.noteEvents;
    if (validated.profileEvents !== undefined) updateData.profileEvents = validated.profileEvents;
    if (validated.socialEvents !== undefined) updateData.socialEvents = validated.socialEvents;
    if (validated.streakEvents !== undefined) updateData.streakEvents = validated.streakEvents;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    // Upsert preferences
    const preferences = await prisma.feedPreferences.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        goalEvents: validated.goalEvents ?? true,
        taskEvents: validated.taskEvents ?? true,
        substepEvents: validated.substepEvents ?? true,
        costEvents: validated.costEvents ?? true,
        noteEvents: validated.noteEvents ?? true,
        profileEvents: validated.profileEvents ?? true,
        socialEvents: validated.socialEvents ?? true,
        streakEvents: validated.streakEvents ?? true,
      },
    });

    return NextResponse.json({
      id: preferences.id,
      goalEvents: preferences.goalEvents,
      taskEvents: preferences.taskEvents,
      substepEvents: preferences.substepEvents,
      costEvents: preferences.costEvents,
      noteEvents: preferences.noteEvents,
      profileEvents: preferences.profileEvents,
      socialEvents: preferences.socialEvents,
      streakEvents: preferences.streakEvents,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/feed-preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
