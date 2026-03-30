import { prisma } from "@/lib/prisma";
import { CostSyncError } from "./sync-error";

interface SyncParams {
  userId: string;
  apiKey: string;         // Decrypted Anthropic admin key (sk-ant-admin-...)
  credentialId: string;   // LLMCredential.id
  test?: boolean;
}

interface SyncResult {
  synced: number;
  total: number;
}

// Anthropic Admin API usage endpoint
// Returns monthly aggregated usage by API key, model, and date
const ADMIN_BASE = "https://api.anthropic.com/v1";

interface AnthropicUsageBucket {
  start_time: string;  // ISO date
  end_time: string;
  api_key_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

interface AnthropicUsageResponse {
  data: AnthropicUsageBucket[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

// Anthropic public pricing (USD per million tokens), conservative snapshot
// These are approximate — actual costs depend on model tier and may change
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6":     { input: 15.0,  output: 75.0  },
  "claude-sonnet-4-6":   { input: 3.0,   output: 15.0  },
  "claude-haiku-4-5-20251001": { input: 0.8,  output: 4.0   },
  // Fallback for unknown models
  default:               { input: 3.0,   output: 15.0  },
};

function costForBucket(bucket: AnthropicUsageBucket): number {
  const pricing = PRICING[bucket.model] ?? PRICING.default;
  const inputCost = (bucket.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (bucket.output_tokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export async function syncAnthropicAdminUsage(params: SyncParams): Promise<SyncResult> {
  const { userId, apiKey, credentialId, test = false } = params;

  // Fetch last 30 days of usage. Use daily buckets.
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startTime = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const endTime = endDate.toISOString().split("T")[0];

  const url = `${ADMIN_BASE}/usage/tokens?start_time=${startTime}&end_time=${endTime}&group_by=api_key,model&limit=100`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      throw new CostSyncError(
        "Anthropic rejected this admin key (401). Ensure you are using a key starting with sk-ant-admin-.",
        422
      );
    }
    if (response.status === 403) {
      throw new CostSyncError(
        "Anthropic admin key lacks permission to read usage data. Check the key's scopes in the Anthropic Console.",
        422
      );
    }
    let detail = "";
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      detail = j.error?.message ?? "";
    } catch {
      if (text) detail = text.slice(0, 280);
    }
    throw new CostSyncError(
      `Anthropic Admin API error (${response.status})${detail ? `: ${detail}` : ""}`,
      response.status >= 500 ? 502 : 400
    );
  }

  let data: AnthropicUsageResponse;
  try {
    data = JSON.parse(text) as AnthropicUsageResponse;
  } catch {
    throw new CostSyncError("Invalid JSON from Anthropic usage API", 502);
  }

  const buckets: AnthropicUsageBucket[] = data.data ?? [];

  if (test || buckets.length === 0) {
    return { synced: 0, total: buckets.length };
  }

  // Deduplicate by (date, apiKeyId, model)
  const existingTxns = await prisma.costTransaction.findMany({
    where: { userId, source: "sync-anthropic-admin" },
    select: { metadata: true },
  });

  const existingKeys = new Set(
    existingTxns
      .map((t) => {
        const m = t.metadata as Record<string, unknown> | null;
        if (!m) return undefined;
        return `${m.date}::${m.apiKeyId}::${m.model}`;
      })
      .filter(Boolean)
  );

  const newBuckets = buckets.filter((b) => {
    const key = `${b.start_time}::${b.api_key_id}::${b.model}`;
    return !existingKeys.has(key);
  });

  if (newBuckets.length === 0) {
    return { synced: 0, total: buckets.length };
  }

  await prisma.costTransaction.createMany({
    data: newBuckets.map((b) => ({
      userId,
      amount: Math.round(costForBucket(b) * 100000) / 100000,
      category: "anthropic",
      description: `Anthropic ${b.model} usage (${b.input_tokens + b.output_tokens} tokens)`,
      date: new Date(b.start_time),
      source: "sync-anthropic-admin",
      metadata: {
        date: b.start_time,
        apiKeyId: b.api_key_id,
        model: b.model,
        inputTokens: b.input_tokens,
        outputTokens: b.output_tokens,
        cacheCreationTokens: b.cache_creation_input_tokens,
        cacheReadTokens: b.cache_read_input_tokens,
        credentialId,
      },
    })),
  });

  return { synced: newBuckets.length, total: buckets.length };
}
