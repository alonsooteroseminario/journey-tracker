import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getAnalytics } from "@/lib/admin/analytics";

/**
 * GET /api/admin/analytics
 * Fetch comprehensive analytics data for the admin dashboard
 */
export async function GET() {
  try {
    // Admin auth check
    await requireAdmin();

    // Fetch analytics
    const analytics = await getAnalytics();

    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);

    // Check if it's a redirect error (from requireAdmin)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error; // Re-throw redirect errors
    }

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
