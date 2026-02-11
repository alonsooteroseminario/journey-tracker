import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import {
  renderVideo,
  prepareGoalProgressProps,
  prepareStreakMilestoneProps,
} from "@/lib/admin/videoRenderer";
import type { VideoTemplateType } from "@/types/admin";

/**
 * GET /api/admin/videos
 * List all videos
 */
export async function GET() {
  try {
    const user = await requireAdmin();

    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/videos
 * Create and render a new video
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const {
      title,
      description,
      templateType,
      sourceData,
      width = 1920,
      height = 1080,
      fps = 30,
    } = body;

    // Validate required fields
    if (!title || !templateType || !sourceData) {
      return NextResponse.json(
        { error: "title, templateType, and sourceData are required" },
        { status: 400 }
      );
    }

    // Validate template type
    const validTemplates: VideoTemplateType[] = [
      "goal_progress",
      "streak_milestone",
      "task_completion",
    ];
    if (!validTemplates.includes(templateType)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 }
      );
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title,
        description,
        templateType,
        sourceData,
        status: "pending",
        width,
        height,
        fps,
      },
    });

    // Start rendering in background (non-blocking)
    // In production, this should be a background job
    setImmediate(async () => {
      let compositionId: string;
      let inputProps: any;

      // Prepare props based on template type
      switch (templateType) {
        case "goal_progress":
          compositionId = "goal-progress";
          inputProps = prepareGoalProgressProps(sourceData, user);
          break;
        case "streak_milestone":
          compositionId = "streak-milestone";
          inputProps = prepareStreakMilestoneProps(
            sourceData.streakCount,
            sourceData.milestone,
            user
          );
          break;
        default:
          console.error("Unsupported template type:", templateType);
          return;
      }

      await renderVideo(video.id, compositionId, inputProps, {
        width,
        height,
        fps,
      });
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
