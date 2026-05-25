import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
  welcomeEmail: z.boolean().optional(),
  profileChanges: z.boolean().optional(),
  goalCreated: z.boolean().optional(),
  goalDeleted: z.boolean().optional(),
  friendInvitation: z.boolean().optional(),
  goalPublished: z.boolean().optional(),
  goalShared: z.boolean().optional(),
  goalForked: z.boolean().optional(),
  streakMilestone: z.boolean().optional(),
  streakReminder: z.boolean().optional(),
  friendStreakReminder: z.boolean().optional(),
  friendActivity: z.boolean().optional(),
  morningDigest: z.boolean().optional(),
  overdueAlert: z.boolean().optional(),
  reminderDigest: z.boolean().optional(),
  reminderStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine(
      (v) => ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].includes(v),
      { message: "reminderStartTime must be between 06:00 and 18:00" },
    )
    .optional(),
  streakProtectTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine(
      (v) => ["15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].includes(v),
      { message: "streakProtectTime must be between 15:00 and 22:00" },
    )
    .optional(),
  discordWebhookUrl: z
    .string()
    .url()
    .refine(
      (v) =>
        v.startsWith("https://discord.com/api/webhooks/") ||
        v.startsWith("https://discordapp.com/api/webhooks/"),
      { message: "Must be a valid Discord webhook URL" },
    )
    .nullable()
    .optional(),
});

/**
 * GET /api/email-preferences
 * Fetch user's email notification preferences (creates default if none exist)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create preferences
    let preferences = await prisma.emailPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      preferences = await prisma.emailPreferences.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Failed to fetch email preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email-preferences
 * Update user's email notification preferences
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updatePreferencesSchema.parse(body);

    // Get or create preferences
    let preferences = await prisma.emailPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      // Create with the provided updates
      preferences = await prisma.emailPreferences.create({
        data: {
          userId: user.id,
          ...validated,
        },
      });
    } else {
      // Update existing preferences
      preferences = await prisma.emailPreferences.update({
        where: { userId: user.id },
        data: validated,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to update email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
