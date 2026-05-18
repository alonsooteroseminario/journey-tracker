import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Per-request row returned to the client. */
export interface UsageRow {
  id: string;
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  description: string | null;
}

/** Summary totals. */
export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  requestCount: number;
  /** ISO string of the oldest transaction shown */
  since: string | null;
}

export interface UsageResponse {
  summary: UsageSummary;
  rows: UsageRow[];
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const days = Number(url.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const transactions = await prisma.costTransaction.findMany({
    where: {
      userId: user.id,
      source: "auto-anthropic",
      date: { gte: since },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  const rows: UsageRow[] = transactions.map((t) => {
    const meta = (t.metadata as { model?: string; inputTokens?: number; outputTokens?: number } | null) ?? {};
    return {
      id: t.id,
      date: t.date.toISOString(),
      model: meta.model ?? "unknown",
      inputTokens: meta.inputTokens ?? 0,
      outputTokens: meta.outputTokens ?? 0,
      costUsd: t.amount,
      description: t.description ?? null,
    };
  });

  const totalInputTokens = rows.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = rows.reduce((s, r) => s + r.outputTokens, 0);
  const totalCostUsd = rows.reduce((s, r) => s + r.costUsd, 0);

  return NextResponse.json({
    summary: {
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      requestCount: rows.length,
      since: rows.length > 0 ? rows[rows.length - 1].date : null,
    },
    rows,
  } satisfies UsageResponse);
}
