import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketplace/[templateId]
 * Fetch a single published template by ID (public - no auth required)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Only allow access to published public templates
    if (template.visibility !== "public" || !template.isPublished) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch marketplace template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
