import { prisma } from "@/lib/prisma";

interface UsageParams {
  clerkId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  date: Date;
}

// Prices per 1M tokens in USD (as of 2026-Q1)
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // Claude 4.x
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-opus-4-20250514": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  // Claude 3.5
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
};

const DEFAULT_PRICE = { input: 3, output: 15 };

export async function logAnthropicUsage(params: UsageParams): Promise<void> {
  const { clerkId, model, inputTokens, outputTokens, date } = params;

  if (inputTokens <= 0 && outputTokens <= 0) return;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return;

  const prices = MODEL_PRICES[model] ?? DEFAULT_PRICE;
  const amount =
    (inputTokens / 1_000_000) * prices.input +
    (outputTokens / 1_000_000) * prices.output;

  if (amount <= 0) return;

  await prisma.costTransaction.create({
    data: {
      userId: user.id,
      amount: Math.round(amount * 100000) / 100000,
      category: "anthropic",
      description: `${model}: ${inputTokens} in + ${outputTokens} out tokens`,
      date,
      source: "auto-anthropic",
      metadata: { model, inputTokens, outputTokens },
    },
  });
}
