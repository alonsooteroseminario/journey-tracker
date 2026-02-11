import { prisma } from "@/lib/prisma";

export const toolDefinition = {
  name: "create_campaign",
  description:
    "Create a new marketing campaign with target goals and posting schedule",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Campaign name",
      },
      description: {
        type: "string",
        description: "Campaign description",
      },
      targetGoals: {
        type: "array",
        items: { type: "string" },
        description: "Array of goal IDs to promote in this campaign",
      },
      platforms: {
        type: "array",
        items: { type: "string" },
        description: "Social platforms for this campaign (twitter, instagram)",
      },
      postingSchedule: {
        type: "object",
        description: "Posting schedule configuration (frequency, times, etc.)",
      },
      startDate: {
        type: "string",
        description: "Campaign start date (ISO string)",
      },
      endDate: {
        type: "string",
        description: "Campaign end date (ISO string)",
      },
    },
    required: ["name", "platforms"],
  },
};

export async function executeCreateCampaign(args: any, userId: string) {
  try {
    const {
      name,
      description,
      targetGoals = [],
      platforms,
      postingSchedule,
      startDate,
      endDate,
    } = args;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        userId,
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

    return {
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platforms: campaign.platforms,
        status: campaign.status,
      },
    };
  } catch (error) {
    console.error("Error in executeCreateCampaign:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
