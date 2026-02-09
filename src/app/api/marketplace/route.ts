import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketplace
 * Browse public templates (no auth required)
 * Supports search, category, difficulty filters, and pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {
      visibility: "public",
      isPublished: true,
    };

    // Add search filter (title or description)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add category filter
    if (category && category !== "all") {
      where.category = category;
    }

    // Add difficulty filter
    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    // Get total count for pagination
    const total = await prisma.goalTemplate.count({ where });

    // Fetch templates with pagination
    const templates = await prisma.goalTemplate.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: [
        { forkCount: "desc" }, // Popular templates first
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch marketplace templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace templates" },
      { status: 500 }
    );
  }
}
