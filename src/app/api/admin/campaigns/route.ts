import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/campaigns
 * List all marketing campaigns with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      include: {
        posts: {
          select: {
            id: true,
            status: true,
            scheduledFor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        platforms: c.platforms,
        status: c.status,
        targetGoals: c.targetGoals,
        startDate: c.startDate,
        endDate: c.endDate,
        postsCount: c.posts.length,
        scheduledPosts: c.posts.filter((p) => p.status === "scheduled").length,
        postedCount: c.posts.filter((p) => p.status === "posted").length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch campaigns",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/campaigns
 * Create a new marketing campaign
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const {
      name,
      description,
      targetGoals = [],
      platforms,
      postingSchedule,
      startDate,
      endDate,
    } = body;

    if (!name || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and platforms are required",
        },
        { status: 400 }
      );
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        userId: user.id,
        name,
        description,
        targetGoals,
        platforms,
        postingSchedule: postingSchedule || {},
        status: "draft",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platforms: campaign.platforms,
        status: campaign.status,
      },
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}
