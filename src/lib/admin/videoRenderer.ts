import "server-only";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

const OUTPUT_DIR = path.join(process.cwd(), "public", "videos");

/**
 * Ensure output directory exists
 */
async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Render a video using Remotion
 */
export async function renderVideo(
  videoId: string,
  compositionId: string,
  inputProps: any,
  options: {
    durationInFrames?: number;
    fps?: number;
    width?: number;
    height?: number;
  } = {}
) {
  try {
    // Dynamic import of Remotion packages (only loaded when actually rendering)
    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, selectComposition } = await import("@remotion/renderer");

    // Update status to rendering
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "rendering" },
    });

    await ensureOutputDir();

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "Root.tsx"),
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Output file path
    const outputFileName = `${videoId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    const publicUrl = `/videos/${outputFileName}`;

    // Render the video
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: options.durationInFrames || composition.durationInFrames,
        fps: options.fps || composition.fps,
        width: options.width || composition.width,
        height: options.height || composition.height,
      },
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
    });

    // Get file size
    const stats = await fs.stat(outputPath);
    const fileSize = stats.size;

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "completed",
        videoUrl: publicUrl,
        duration: Math.round(
          (options.durationInFrames || composition.durationInFrames) /
            (options.fps || composition.fps)
        ),
        fileSize,
      },
    });

    return {
      success: true,
      videoUrl: publicUrl,
    };
  } catch (error) {
    console.error("Video rendering error:", error);

    // Update with error
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Prepare video props from goal data
 */
export function prepareGoalProgressProps(goal: any, user: any) {
  const tasks = Array.isArray(goal.tasks) ? goal.tasks : [];
  const completedTasks = tasks.filter((task: any) => task.completed).length;
  const progress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return {
    goalTitle: goal.title,
    progress,
    tasksCompleted: completedTasks,
    totalTasks: tasks.length,
    userName: user.name,
  };
}

/**
 * Prepare video props from streak data
 */
export function prepareStreakMilestoneProps(
  streak: number,
  milestone: number,
  user: any
) {
  return {
    userName: user.name,
    streakCount: streak,
    milestone,
  };
}
