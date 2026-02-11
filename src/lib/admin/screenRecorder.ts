import "server-only";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

const OUTPUT_DIR = path.join(process.cwd(), "public", "recordings");

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
 * Recording flow configurations
 */
const FLOW_CONFIGS: Record<string, any> = {
  goal_creation: {
    name: "Goal Creation Flow",
    steps: [
      { action: "navigate", url: "/goals" },
      { action: "click", selector: 'button:has-text("New Goal")' },
      { action: "fill", selector: 'input[placeholder*="goal"]', value: "Learn React" },
      { action: "fill", selector: 'textarea', value: "Master React fundamentals" },
      { action: "click", selector: 'button:has-text("Create")' },
      { action: "wait", duration: 2000 },
    ],
  },
  task_completion: {
    name: "Task Completion Flow",
    steps: [
      { action: "navigate", url: "/goals" },
      { action: "wait", duration: 1000 },
      { action: "click", selector: '.goal-card:first-child' },
      { action: "wait", duration: 500 },
      { action: "click", selector: 'input[type="checkbox"]:first-of-type' },
      { action: "wait", duration: 2000 },
    ],
  },
  dashboard_tour: {
    name: "Dashboard Overview",
    steps: [
      { action: "navigate", url: "/" },
      { action: "wait", duration: 2000 },
      { action: "scroll", distance: 300 },
      { action: "wait", duration: 1000 },
      { action: "scroll", distance: 300 },
      { action: "wait", duration: 1000 },
    ],
  },
};

/**
 * Execute a recording flow step
 */
async function executeStep(page: any, step: any) {
  switch (step.action) {
    case "navigate":
      await page.goto(step.url);
      break;
    case "click":
      await page.click(step.selector);
      break;
    case "fill":
      await page.fill(step.selector, step.value);
      break;
    case "wait":
      await page.waitForTimeout(step.duration);
      break;
    case "scroll":
      await page.evaluate((distance: number) => {
        window.scrollBy(0, distance);
      }, step.distance);
      break;
    default:
      console.warn(`Unknown step action: ${step.action}`);
  }
}

/**
 * Record a screen flow using Playwright
 */
export async function recordScreenFlow(
  recordingId: string,
  flowType: string,
  baseUrl: string,
  authCookies?: any[]
) {
  try {
    // Dynamic import of Playwright
    const { chromium } = await import("playwright");

    // Update status to recording
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: "recording" },
    });

    await ensureOutputDir();

    // Get flow config
    const flowConfig = FLOW_CONFIGS[flowType];
    if (!flowConfig) {
      throw new Error(`Unknown flow type: ${flowType}`);
    }

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: OUTPUT_DIR,
        size: { width: 1920, height: 1080 },
      },
    });

    // Set auth cookies if provided
    if (authCookies && authCookies.length > 0) {
      await context.addCookies(authCookies);
    }

    const page = await context.newPage();

    // Execute flow steps
    for (const step of flowConfig.steps) {
      const fullUrl = step.url ? `${baseUrl}${step.url}` : undefined;
      await executeStep(page, { ...step, url: fullUrl });
    }

    // Wait a bit before closing
    await page.waitForTimeout(1000);

    // Close page and context to finalize video
    await page.close();
    await context.close();
    await browser.close();

    // Find the recorded video file
    const files = await fs.readdir(OUTPUT_DIR);
    const videoFiles = files.filter(f => f.endsWith('.webm'));

    if (videoFiles.length === 0) {
      throw new Error("No video file generated");
    }

    // Get the most recent video file
    const videoFile = videoFiles[videoFiles.length - 1];
    const videoPath = path.join(OUTPUT_DIR, videoFile);

    // Rename to recordingId
    const outputFileName = `${recordingId}.webm`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    await fs.rename(videoPath, outputPath);

    const publicUrl = `/recordings/${outputFileName}`;

    // Get file stats
    const stats = await fs.stat(outputPath);
    const fileSize = stats.size;

    // Calculate approximate duration (assuming 30fps, this is an estimate)
    const duration = flowConfig.steps.reduce((acc: number, step: any) => {
      return acc + (step.duration || 500) / 1000;
    }, 0);

    // Update recording record
    await prisma.recording.update({
      where: { id: recordingId },
      data: {
        status: "completed",
        videoUrl: publicUrl,
        duration: Math.round(duration),
        fileSize,
      },
    });

    return {
      success: true,
      videoUrl: publicUrl,
    };
  } catch (error) {
    console.error("Screen recording error:", error);

    // Update with error
    await prisma.recording.update({
      where: { id: recordingId },
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
 * Get available flow types
 */
export function getAvailableFlows() {
  return Object.keys(FLOW_CONFIGS).map(key => ({
    type: key,
    name: FLOW_CONFIGS[key].name,
  }));
}
