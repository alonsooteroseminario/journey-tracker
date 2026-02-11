import { prisma } from "@/lib/prisma";

export const toolDefinition = {
  name: "generate_post_content",
  description:
    "Generate AI-powered social media post content based on goal data and platform",
  input_schema: {
    type: "object" as const,
    properties: {
      goalId: {
        type: "string",
        description: "Goal ID to generate content about",
      },
      platform: {
        type: "string",
        description: "Target platform (twitter or instagram)",
      },
      tone: {
        type: "string",
        description: "Content tone (professional, casual, enthusiastic, motivational)",
      },
      includeHashtags: {
        type: "boolean",
        description: "Whether to include hashtags",
      },
    },
    required: ["goalId", "platform"],
  },
};

export async function executeGeneratePostContent(args: any, userId: string) {
  try {
    const { goalId, platform, tone = "professional", includeHashtags = true } = args;

    // Verify ownership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        userId: true,
        title: true,
        description: true,
        tasks: true,
      },
    });

    if (!goal || goal.userId !== userId) {
      return {
        success: false,
        error: "Goal not found or unauthorized",
      };
    }

    // Parse tasks
    const tasks = Array.isArray(goal.tasks) ? goal.tasks : [];
    const completedTasks = tasks.filter((task: any) => task.completed).length;
    const progress =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Generate content based on platform and tone
    let content = "";
    const hashtags = includeHashtags
      ? ["goals", "productivity", "progress", "journey"]
      : [];

    // Content templates
    const templates = {
      twitter: {
        professional: `Making progress on my goal: ${goal.title}. ${progress}% complete with ${completedTasks}/${tasks.length} tasks done. Staying focused and moving forward! 💼`,
        casual: `Hey! Just wanted to share - I'm ${progress}% done with "${goal.title}" 🎯 ${completedTasks} tasks down, feeling good about this!`,
        enthusiastic: `🚀 AMAZING progress on my goal! ${progress}% complete on "${goal.title}" - ${completedTasks} tasks crushed! Nothing can stop me now! 🔥`,
        motivational: `Every step counts! ${progress}% done with "${goal.title}". ${completedTasks} tasks completed, proving that consistency wins. Keep pushing! 💪`,
      },
      instagram: {
        professional: `📊 Goal Update: ${goal.title}\n\nProgress: ${progress}%\nTasks Completed: ${completedTasks}/${tasks.length}\n\nStaying committed to continuous improvement and focused execution.`,
        casual: `Just checking in on my goal journey! 🎯\n\n"${goal.title}"\n\n${progress}% done • ${completedTasks} tasks complete\n\nFeeling pretty good about where this is going!`,
        enthusiastic: `🎉 PROGRESS UPDATE! 🎉\n\nGoal: ${goal.title}\n✅ ${progress}% Complete!\n✅ ${completedTasks} Tasks Done!\n\nThe momentum is REAL! Can't wait to hit 100%! 🚀`,
        motivational: `💫 Your daily reminder that progress isn't always linear, but it's always worth it.\n\nGoal: ${goal.title}\nProgress: ${progress}%\nTasks: ${completedTasks}/${tasks.length}\n\nEvery small win adds up. Keep going! 💪`,
      },
    };

    content =
      templates[platform as keyof typeof templates]?.[
        tone as keyof (typeof templates)["twitter"]
      ] || templates.twitter.professional;

    return {
      success: true,
      content,
      hashtags,
      characterCount: content.length,
      platform,
      tone,
    };
  } catch (error) {
    console.error("Error in executeGeneratePostContent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
