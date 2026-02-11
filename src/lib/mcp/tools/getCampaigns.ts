import { prisma } from "@/lib/prisma";

export const toolDefinition = {
  name: "get_campaigns",
  description: "Get all marketing campaigns for the user",
  input_schema: {
    type: "object" as const,
    properties: {
      status: {
        type: "string",
        description: "Filter by status (draft, active, paused, completed)",
      },
    },
  },
};

export async function executeGetCampaigns(args: any, userId: string) {
  try {
    const { status } = args;

    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        userId,
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

    return {
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
      })),
      count: campaigns.length,
    };
  } catch (error) {
    console.error("Error in executeGetCampaigns:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
