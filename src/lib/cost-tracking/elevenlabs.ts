import { prisma } from "@/lib/prisma";
import { CostSyncError } from "./sync-error";

interface SyncParams {
  userId: string;
  apiKey: string;
  credentialId: string;
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
  character_count_change_from: number; // quota level BEFORE generation
  character_count_change_to: number;   // quota level AFTER generation
}

interface ElevenLabsHistoryPage {
  history: ElevenLabsHistoryItem[];
  has_more: boolean;
  last_history_item_id: string | null;
}

const COST_PER_CHAR = 0.0003; // $0.30 per 1000 characters (Creator tier estimate)
const MAX_ITEMS = 500;        // cap to avoid serverless timeout

async function fetchHistoryPage(apiKey: string, startAfter?: string): Promise<ElevenLabsHistoryPage> {
  const params = new URLSearchParams({ page_size: "100" });
  if (startAfter) params.set("start_after_history_item_id", startAfter);

  const response = await fetch(`https://api.elevenlabs.io/v1/history?${params}`, {
    headers: { "xi-api-key": apiKey },
  });
  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      throw new CostSyncError(
        "ElevenLabs rejected this API key (401). Use the key from https://elevenlabs.io/app/settings/api-keys — copy the full value, no spaces.",
        422
      );
    }
    let detail = "";
    try {
      const j = JSON.parse(text) as { detail?: { message?: string } | string };
      if (typeof j.detail === "string") detail = j.detail;
      else if (j.detail && typeof j.detail === "object" && "message" in j.detail) {
        detail = String((j.detail as { message?: string }).message ?? "");
      }
    } catch {
      if (text) detail = text.slice(0, 280);
    }
    throw new CostSyncError(
      `ElevenLabs API error (${response.status})${detail ? `: ${detail}` : ""}`,
      response.status >= 500 ? 502 : 400
    );
  }

  try {
    return JSON.parse(text) as ElevenLabsHistoryPage;
  } catch {
    throw new CostSyncError("Invalid JSON from ElevenLabs history API", 502);
  }
}

export async function syncElevenLabsUsage(params: SyncParams): Promise<SyncResult> {
  const { userId, apiKey, credentialId, test = false } = params;

  // Paginate up to MAX_ITEMS
  const allItems: ElevenLabsHistoryItem[] = [];
  let lastId: string | undefined;

  do {
    const page = await fetchHistoryPage(apiKey, lastId);
    allItems.push(...page.history);
    lastId = page.last_history_item_id ?? undefined;
    if (!page.has_more) break;
  } while (allItems.length < MAX_ITEMS);

  const items = allItems.slice(0, MAX_ITEMS);

  if (test || items.length === 0) {
    return { synced: 0, total: items.length };
  }

  // Deduplicate by historyItemId
  const existingTxns = await prisma.costTransaction.findMany({
    where: { userId, source: "sync-elevenlabs" },
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

  await prisma.costTransaction.createMany({
    data: newItems.map((item) => {
      // Characters used = quota before - quota after
      const chars = Math.max(0, item.character_count_change_from - item.character_count_change_to);
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
          credentialId,
        },
      };
    }),
  });

  return { synced: newItems.length, total: items.length };
}
