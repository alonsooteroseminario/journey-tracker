import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getModelMetadata, isValidModel } from "@/lib/admin/modelRegistry";

/**
 * GET /api/admin/explorer/[model]/[id]
 * Fetch a single record by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ model: string; id: string }> }
) {
  try {
    await requireAdmin();

    const { model: modelName, id } = await params;

    // Validate model
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const metadata = getModelMetadata(modelName)!;

    // Fetch record
    const record = await metadata.delegate.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Failed to fetch record:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/explorer/[model]/[id]
 * Update a record
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ model: string; id: string }> }
) {
  try {
    await requireAdmin();

    const { model: modelName, id } = await params;
    const body = await request.json();

    // Validate model
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const metadata = getModelMetadata(modelName)!;

    // Update record
    const record = await metadata.delegate.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Failed to update record:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // Check for Prisma errors
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/explorer/[model]/[id]
 * Delete a record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ model: string; id: string }> }
) {
  try {
    await requireAdmin();

    const { model: modelName, id } = await params;

    // Validate model
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const metadata = getModelMetadata(modelName)!;

    // Delete record
    await metadata.delegate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete record:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // Check for Prisma errors
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}
