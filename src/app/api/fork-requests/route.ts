import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/fork-requests
 * List fork requests for the current user's templates
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all templates owned by this user that have fork requests
    const requests = await prisma.forkRequest.findMany({
      where: {
        template: {
          authorId: user.id,
        },
      },
      include: {
        requester: {
          select: { id: true, name: true, profileImage: true },
        },
        template: {
          select: { id: true, title: true, icon: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch fork requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch fork requests" },
      { status: 500 }
    );
  }
}
