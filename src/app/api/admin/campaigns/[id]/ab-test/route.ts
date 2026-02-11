import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getABTestResults } from "@/lib/admin/campaigns/abTest";

/**
 * GET /api/admin/campaigns/[id]/ab-test
 * Get A/B test results for a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const results = await getABTestResults(id);

    if (!results) {
      return NextResponse.json(
        {
          success: false,
          error: "A/B test not enabled or no data available",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error fetching A/B test results:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
