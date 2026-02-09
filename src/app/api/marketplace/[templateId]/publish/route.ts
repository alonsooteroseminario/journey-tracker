import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";

/**
 * POST /api/marketplace/[templateId]/publish
 * Publish a template to the public marketplace
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

    // Verify ownership
    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only publish your own templates" },
        { status: 403 }
      );
    }

    if (template.isPublished) {
      return NextResponse.json(
        { error: "Template is already published" },
        { status: 400 }
      );
    }

    // Publish template
    const updated = await prisma.goalTemplate.update({
      where: { id: templateId },
      data: {
        isPublished: true,
        visibility: "public",
      },
    });

    // Send notification
    notify(user.id, "goalPublished", {
      userName: user.name,
      goalTitle: template.title,
      goalIcon: template.icon || undefined,
    }).catch((err) => {
      console.error("Failed to send goal published email:", err);
    });

    // Create feed item
    prisma.feedItem
      .create({
        data: {
          userId: user.id,
          type: "goal_shared",
          content: `${user.name} published a template to the marketplace: ${template.icon || "🎯"} ${template.title}`,
          metadata: { templateId: template.id, isPublic: true },
          visibility: "public",
        },
      })
      .catch((err) => {
        console.error("Failed to create feed item:", err);
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to publish template:", error);
    return NextResponse.json(
      { error: "Failed to publish template" },
      { status: 500 }
    );
  }
}
