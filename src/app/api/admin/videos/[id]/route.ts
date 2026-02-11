import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/**
 * DELETE /api/admin/videos/[id]
 * Delete a video
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: videoId } = await params;

    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true, videoUrl: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete video file if exists
    if (video.videoUrl) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          video.videoUrl
        );
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Error deleting video file:", error);
        // Continue even if file deletion fails
      }
    }

    // Delete database record
    await prisma.video.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
