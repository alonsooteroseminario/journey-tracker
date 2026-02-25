import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTemplateSchema = z.object({
  // Existing metadata fields
  lessonsLearned: z.string().optional(),
  tips: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["friends", "public"]).optional(),
  isPublished: z.boolean().optional(),
  // Structural mutations
  action: z.enum([
    "addTask", "updateTask", "removeTask",
    "addPhase", "updatePhase", "removePhase",
    "addSubstep", "updateSubstep", "removeSubstep",
    "addResource", "updateResource", "removeResource",
  ]).optional(),
  payload: z.record(z.string(), z.any()).optional(),
}).refine((data) => {
  if (data.action && !data.payload) return false;
  return true;
}, { message: "payload is required when action is provided" });

/**
 * GET /api/templates/[templateId]
 * Fetch a single template by ID
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

    // Check access
    if (template.visibility === "friends" && template.authorId !== user.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: user.id, friendId: template.authorId },
            { userId: template.authorId, friendId: user.id },
          ],
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: "You don't have access to this template" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates/[templateId]
 * Update template metadata
 */
export async function PATCH(
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
    const validated = updateTemplateSchema.parse(body);

    // Verify ownership
    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own templates" },
        { status: 403 }
      );
    }

    const { action, payload, ...metadataUpdates } = validated;

    // Apply metadata updates if any
    let updateData: Record<string, unknown> = {};
    const hasMetadata = Object.values(metadataUpdates).some((v) => v !== undefined);
    if (hasMetadata) {
      updateData = { ...metadataUpdates };
    }

    // Apply structural action if provided
    if (action && payload) {
      const tasks = (template.tasks as Record<string, unknown>[]) || [];
      const phases = (template.phases as Record<string, unknown>[]) || [];
      const resources = (template.resources as Record<string, unknown>[]) || [];

      switch (action) {
        case "addTask": {
          const newTask = {
            id: crypto.randomUUID(),
            title: payload.title || "New Task",
            description: payload.description || "",
            status: "not_started",
            order: tasks.length,
            substeps: [],
          };
          updateData.tasks = [...tasks, newTask];
          break;
        }
        case "updateTask": {
          updateData.tasks = tasks.map((t) =>
            t.id === payload.taskId ? { ...t, ...payload.updates } : t
          );
          break;
        }
        case "removeTask": {
          updateData.tasks = tasks.filter((t) => t.id !== payload.taskId);
          break;
        }
        case "addSubstep": {
          updateData.tasks = tasks.map((t) => {
            if (t.id !== payload.taskId) return t;
            const substeps = (t.substeps as Record<string, unknown>[]) || [];
            return {
              ...t,
              substeps: [...substeps, {
                id: crypto.randomUUID(),
                title: payload.title || "New Substep",
                description: payload.description || "",
                status: "not_started",
                order: substeps.length,
              }],
            };
          });
          break;
        }
        case "updateSubstep": {
          updateData.tasks = tasks.map((t) => {
            if (t.id !== payload.taskId) return t;
            return {
              ...t,
              substeps: ((t.substeps as Record<string, unknown>[]) || []).map((s) =>
                s.id === payload.substepId ? { ...s, ...payload.updates } : s
              ),
            };
          });
          break;
        }
        case "removeSubstep": {
          updateData.tasks = tasks.map((t) => {
            if (t.id !== payload.taskId) return t;
            return {
              ...t,
              substeps: ((t.substeps as Record<string, unknown>[]) || []).filter(
                (s) => s.id !== payload.substepId
              ),
            };
          });
          break;
        }
        case "addPhase": {
          updateData.phases = [...phases, {
            id: crypto.randomUUID(),
            name: payload.name || "New Phase",
            description: payload.description || "",
            taskIds: payload.taskIds || [],
          }];
          break;
        }
        case "updatePhase": {
          updateData.phases = phases.map((p) =>
            p.id === payload.phaseId ? { ...p, ...payload.updates } : p
          );
          break;
        }
        case "removePhase": {
          updateData.phases = phases.filter((p) => p.id !== payload.phaseId);
          break;
        }
        case "addResource": {
          updateData.resources = [...resources, {
            category: payload.category || "General",
            resources: [{ name: payload.name || "", url: payload.url || "" }],
          }];
          break;
        }
        case "updateResource": {
          updateData.resources = resources.map((r, i) =>
            i === payload.index ? { ...r, ...payload.updates } : r
          );
          break;
        }
        case "removeResource": {
          updateData.resources = resources.filter((_, i) => i !== payload.index);
          break;
        }
      }
    }

    // Update template
    const updated = await prisma.goalTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to update template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[templateId]
 * Delete a template
 */
export async function DELETE(
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
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own templates" },
        { status: 403 }
      );
    }

    // Delete template
    await prisma.goalTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
