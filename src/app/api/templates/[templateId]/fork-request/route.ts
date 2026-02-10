import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notify } from "@/lib/email/notifications";

const forkRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

/**
 * POST /api/templates/[templateId]/fork-request
 * Create a fork request for a friends-only template
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const body = await request.json();
    const validated = forkRequestSchema.parse(body);

    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Only friends-only templates need fork requests
    if (template.visibility === "public" && template.isPublished) {
      return NextResponse.json(
        { error: "Public templates can be forked directly" },
        { status: 400 }
      );
    }

    // Cannot request to fork own template
    if (template.authorId === user.id) {
      return NextResponse.json(
        { error: "Cannot request to fork your own template" },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existing = await prisma.forkRequest.findFirst({
      where: {
        templateId,
        requesterId: user.id,
        status: "pending",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request for this template" },
        { status: 409 }
      );
    }

    const forkRequest = await prisma.forkRequest.create({
      data: {
        templateId,
        requesterId: user.id,
        message: validated.message,
      },
      include: {
        requester: { select: { id: true, name: true, profileImage: true } },
      },
    });

    // Notify template author
    notify(template.authorId, "goalForked", {
      userName: template.author.name,
      goalTitle: template.title,
      goalIcon: template.icon || undefined,
      forkerName: user.name,
      totalForks: template.forkCount,
    }).catch((err) => {
      console.error("Failed to send fork request notification:", err);
    });

    return NextResponse.json(forkRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create fork request:", error);
    return NextResponse.json(
      { error: "Failed to create fork request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/templates/[templateId]/fork-request
 * Get the current user's fork request status for a template
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;

    const forkRequest = await prisma.forkRequest.findFirst({
      where: {
        templateId,
        requesterId: user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forkRequest);
  } catch (error) {
    console.error("Failed to fetch fork request:", error);
    return NextResponse.json(
      { error: "Failed to fetch fork request" },
      { status: 500 }
    );
  }
}
