import Anthropic from "@anthropic-ai/sdk";
import { getUserAgentKey } from "@/lib/agent/getUserAgentKey";
import { logAnthropicUsage } from "@/lib/cost-tracking/anthropic";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 5000;

/**
 * Generates a short AI-personalized context paragraph for email notifications.
 * Uses the user's BYOK Anthropic key. Returns null if no key is saved,
 * the call times out, or any error occurs — email still sends without AI context.
 */
export async function generateAiContext(
  clerkId: string,
  prompt: string,
): Promise<string | null> {
  const apiKey = await getUserAgentKey(clerkId);
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create(
      {
        model: HAIKU_MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );

    const paragraph =
      response.content[0]?.type === "text"
        ? response.content[0].text.trim()
        : null;

    if (paragraph && response.usage) {
      logAnthropicUsage({
        clerkId,
        model: HAIKU_MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        date: new Date(),
      }).catch(() => {});
    }

    return paragraph;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
