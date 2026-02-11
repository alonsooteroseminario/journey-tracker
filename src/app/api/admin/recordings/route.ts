import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordScreenFlow, getAvailableFlows } from "@/lib/admin/screenRecorder";
import type { RecordingFlowType } from "@/types/admin";

/**
 * GET /api/admin/recordings
 * List all recordings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Handle flows listing
    if (action === "flows") {
      const flows = getAvailableFlows();
      return NextResponse.json({ flows });
    }

    // List recordings
    const user = await requireAdmin();

    const recordings = await prisma.recording.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { error: "Failed to fetch recordings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/recordings
 * Create and start a new screen recording
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const { title, description, flowType, flowConfig } = body;

    // Validate required fields
    if (!title || !flowType) {
      return NextResponse.json(
        { error: "title and flowType are required" },
        { status: 400 }
      );
    }

    // Validate flow type
    const validFlows: RecordingFlowType[] = [
      "goal_creation",
      "task_completion",
      "dashboard_tour",
      "custom",
    ];
    if (!validFlows.includes(flowType)) {
      return NextResponse.json(
        { error: "Invalid flow type" },
        { status: 400 }
      );
    }

    // Create recording record
    const recording = await prisma.recording.create({
      data: {
        userId: user.id,
        title,
        description,
        flowType,
        flowConfig: flowConfig || {},
        status: "pending",
      },
    });

    // Get base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Start recording in background (non-blocking)
    setImmediate(async () => {
      // In a real production app, you'd want to get actual auth cookies
      // For now, we'll record without authentication (public flows only)
      await recordScreenFlow(recording.id, flowType, baseUrl);
    });

    return NextResponse.json({ recording }, { status: 201 });
  } catch (error) {
    console.error("Error creating recording:", error);
    return NextResponse.json(
      { error: "Failed to create recording" },
      { status: 500 }
    );
  }
}
