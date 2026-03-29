import { prisma } from "@/lib/prisma";

interface SyncParams {
  userId: string; // Prisma User.id
  apiKey: string; // Decrypted ElevenLabs API key
  test?: boolean;
}

interface SyncResult {
  synced: number;
  total: number;
}

interface ElevenLabsHistoryItem {
  history_item_id: string;
  voice_id: string;
  model_id: string;
  text: string;
  date_unix: number;
  character_count_change_from: number;
}

// Approximate per-character rate in USD (conservative Creator-tier estimate)
const COST_PER_CHAR = 0.0003; // $0.30 per 1000 characters

export async function syncElevenLabsUsage(params: SyncParams): Promise<SyncResult> {
  const { userId, apiKey, test = false } = params;

  // Fetch history from ElevenLabs
  const response = await fetch("https://api.elevenlabs.io/v1/history", {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid ElevenLabs API key");
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const data = await response.json() as { history: ElevenLabsHistoryItem[] };
  const items: ElevenLabsHistoryItem[] = data.history ?? [];

  if (test || items.length === 0) {
    return { synced: 0, total: items.length };
  }

  // Find existing history IDs to deduplicate
  const existingTxns = await prisma.costTransaction.findMany({
    where: {
      userId,
      source: "sync-elevenlabs",
    },
    select: { metadata: true },
  });

  const existingIds = new Set(
    existingTxns
      .map((t) => (t.metadata as Record<string, unknown> | null)?.historyItemId as string | undefined)
      .filter(Boolean)
  );

  const newItems = items.filter((item) => !existingIds.has(item.history_item_id));

  if (newItems.length === 0) {
    return { synced: 0, total: items.length };
  }

  // Batch create new transactions
  await prisma.costTransaction.createMany({
    data: newItems.map((item) => {
      const chars = Math.abs(item.character_count_change_from ?? 0);
      return {
        userId,
        amount: Math.round(chars * COST_PER_CHAR * 100000) / 100000,
        category: "elevenlabs",
        description: item.text ? item.text.slice(0, 80) : "ElevenLabs generation",
        date: new Date(item.date_unix * 1000),
        source: "sync-elevenlabs",
        metadata: {
          historyItemId: item.history_item_id,
          voiceId: item.voice_id,
          modelId: item.model_id,
          characters: chars,
        },
      };
    }),
  });

  return { synced: newItems.length, total: items.length };
}
