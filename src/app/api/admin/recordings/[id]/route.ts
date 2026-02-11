import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/**
 * DELETE /api/admin/recordings/[id]
 * Delete a recording
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: recordingId } = await params;

    // Verify ownership
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: { userId: true, videoUrl: true },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (recording.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete video file if exists
    if (recording.videoUrl) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          recording.videoUrl
        );
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Error deleting recording file:", error);
        // Continue even if file deletion fails
      }
    }

    // Delete database record
    await prisma.recording.delete({
      where: { id: recordingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { error: "Failed to delete recording" },
      { status: 500 }
    );
  }
}
