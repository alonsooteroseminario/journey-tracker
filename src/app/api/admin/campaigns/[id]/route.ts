import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/campaigns/[id]
 * Get a specific campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            id: true,
            content: true,
            status: true,
            scheduledFor: true,
            postedAt: true,
            platformPostId: true,
            account: {
              select: {
                platform: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch campaign",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/campaigns/[id]
 * Update a campaign
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 }
      );
    }

    const { name, description, status, targetGoals, platforms, postingSchedule, startDate, endDate } = body;

    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(targetGoals && { targetGoals }),
        ...(platforms && { platforms }),
        ...(postingSchedule && { postingSchedule }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update campaign",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/campaigns/[id]
 * Delete a campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 }
      );
    }

    await prisma.marketingCampaign.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete campaign",
      },
      { status: 500 }
    );
  }
}
