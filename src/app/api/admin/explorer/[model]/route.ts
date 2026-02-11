import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getModelMetadata, isValidModel } from "@/lib/admin/modelRegistry";

/**
 * GET /api/admin/explorer/[model]
 * Fetch paginated records for a model with optional search/filter/sort
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    await requireAdmin();

    const { model: modelName } = await params;
    const { searchParams } = new URL(request.url);

    // Validate model
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const metadata = getModelMetadata(modelName)!;

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Build where clause for search
    const where: any = {};
    if (search && metadata.searchableFields.length > 0) {
      where.OR = metadata.searchableFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }

    // Build orderBy
    const orderBy: any = {};
    if (metadata.sortableFields.includes(sortBy)) {
      orderBy[sortBy] = order;
    } else {
      orderBy.createdAt = "desc";
    }

    // Execute query
    const [data, total] = await Promise.all([
      metadata.delegate.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      metadata.delegate.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch model records:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/explorer/[model]
 * Create a new record (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    await requireAdmin();

    const { model: modelName } = await params;
    const body = await request.json();

    // Validate model
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const metadata = getModelMetadata(modelName)!;

    // Create record
    const record = await metadata.delegate.create({
      data: body,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create record:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
