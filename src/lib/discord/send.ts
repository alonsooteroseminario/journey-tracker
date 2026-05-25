export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

const CADENCE_BLUE = 0x5b50e8;

/**
 * Posts a message to a Discord channel via webhook URL.
 * Returns true on success, false on any failure (fire-and-forget safe).
 * Pass webhookUrl explicitly to support per-user webhooks in future.
 */
export async function sendDiscordMessage(
  webhookUrl: string,
  message: DiscordMessage,
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Cadence", ...message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Build a task-reminder digest Discord embed. */
export function buildTaskReminderEmbed(
  userName: string,
  tasks: { title: string; goalTitle: string; dueDate?: string }[],
  aiContext?: string | null,
): DiscordEmbed {
  const taskLines = tasks
    .map((t) => {
      const duePart = t.dueDate
        ? ` · due ${new Date(t.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "";
      return `☐ **${t.title}**\n  _${t.goalTitle}${duePart}_`;
    })
    .join("\n\n");

  return {
    title: `🔔 ${tasks.length} task${tasks.length !== 1 ? "s" : ""} waiting for you`,
    description: `Hey ${userName}, here are the tasks you flagged for a daily nudge:\n\n${taskLines}${aiContext ? `\n\n_${aiContext}_` : ""}`,
    color: CADENCE_BLUE,
    footer: { text: "Cadence · task reminders" },
  };
}

/** Build a streak-at-risk Discord embed. */
export function buildStreakReminderEmbed(
  userName: string,
  currentStreak: number,
  aiContext?: string | null,
): DiscordEmbed {
  return {
    title: `🔥 Don't lose your ${currentStreak}-day streak!`,
    description: `Hey ${userName}, you haven't logged any activity today. Complete at least one task or substep to keep your streak alive.${aiContext ? `\n\n_${aiContext}_` : ""}`,
    color: 0xe85b50,
    footer: { text: "Cadence · streak protection" },
  };
}
