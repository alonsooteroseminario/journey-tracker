"use client";

import { useEffect, useState, useCallback } from "react";
import type { UsageResponse, UsageRow } from "@/app/api/settings/ai-key/usage/route";

function shortModel(m: string): string {
  if (m.includes("opus-4")) return "Opus 4";
  if (m.includes("sonnet-4")) return "Sonnet 4";
  if (m.includes("haiku-4")) return "Haiku 4";
  if (m.includes("opus")) return "Opus";
  if (m.includes("sonnet")) return "Sonnet";
  if (m.includes("haiku")) return "Haiku";
  return m.split("-").slice(0, 2).join("-");
}

function formatCost(usd: number): string {
  if (usd < 0.0001) return "<$0.0001";
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  return `$${usd.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AgentUsageStats() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/ai-key/usage?days=${days}&limit=50`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const { summary, rows } = data ?? { summary: null, rows: [] };

  return (
    <div className="mt-8 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <span className="text-lg">📊</span> API Usage
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-text-secondary"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={load}
            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors"
            title="Refresh"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-20 flex items-center justify-center text-text-muted text-sm">Loading usage data…</div>
      ) : summary && summary.requestCount === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-4 text-center text-text-muted text-sm">
          No API calls in the last {days} days. Start chatting to see usage here.
        </div>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Total cost"
              value={formatCost(summary.totalCostUsd)}
              sub={`${days}d`}
              accent
            />
            <SummaryCard
              label="Requests"
              value={String(summary.requestCount)}
              sub="API calls"
            />
            <SummaryCard
              label="Tokens in"
              value={formatTokens(summary.totalInputTokens)}
              sub="prompt"
            />
            <SummaryCard
              label="Tokens out"
              value={formatTokens(summary.totalOutputTokens)}
              sub="completion"
            />
          </div>

          {/* Request log */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                Recent requests {rows.length > 0 && <span className="text-text-muted">({rows.length})</span>}
              </span>
              {rows.length > 5 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-brand-primary hover:underline"
                >
                  {expanded ? "Show less" : `Show all ${rows.length}`}
                </button>
              )}
            </div>

            <div className="divide-y divide-border">
              {(expanded ? rows : rows.slice(0, 10)).map((row) => (
                <RequestRow key={row.id} row={row} />
              ))}
            </div>

            {rows.length === 0 && (
              <div className="px-4 py-6 text-center text-text-muted text-sm">No requests in this period</div>
            )}
          </div>

          <p className="text-xs text-text-muted text-right">
            Auto-refreshes every 30s · <button onClick={load} className="underline hover:text-brand-primary">Refresh now</button>
          </p>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "bg-brand-light/20 border-brand-primary/30" : "bg-surface-muted border-border"}`}>
      <div className={`text-xl font-bold tabular-nums ${accent ? "text-brand-primary" : "text-text-primary"}`}>{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
      <div className="text-[10px] text-text-muted/70 mt-0.5">{sub}</div>
    </div>
  );
}

function RequestRow({ row }: { row: UsageRow }) {
  const totalTokens = row.inputTokens + row.outputTokens;
  const costPct = row.costUsd > 0 ? Math.min(100, (row.costUsd / 0.05) * 100) : 0; // max at $0.05

  return (
    <div className="px-4 py-3 flex items-start gap-3 hover:bg-surface-hover transition-colors">
      {/* Time + model */}
      <div className="flex-shrink-0 w-20 text-right">
        <div className="text-xs text-text-muted tabular-nums">{timeAgo(row.date)}</div>
        <div className="text-[10px] text-brand-muted mt-0.5">{shortModel(row.model)}</div>
      </div>

      {/* Token bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="text-text-muted">↑</span>
            <span className="tabular-nums font-medium">{formatTokens(row.inputTokens)}</span>
            <span className="text-text-muted text-[10px]">in</span>
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <span className="text-brand-primary">↓</span>
            <span className="tabular-nums font-medium">{formatTokens(row.outputTokens)}</span>
            <span className="text-text-muted text-[10px]">out</span>
          </span>
          <span className="text-border">·</span>
          <span className="text-text-muted tabular-nums">{formatTokens(totalTokens)} total</span>
        </div>
        {/* Token split bar */}
        <div className="h-1 bg-surface-hover rounded-full overflow-hidden flex">
          <div
            className="bg-text-muted/50 rounded-l-full"
            style={{ width: totalTokens > 0 ? `${(row.inputTokens / totalTokens) * 100}%` : "0%" }}
          />
          <div
            className="bg-brand-primary/70 rounded-r-full"
            style={{ width: totalTokens > 0 ? `${(row.outputTokens / totalTokens) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Cost */}
      <div className="flex-shrink-0 text-right">
        <div className="text-xs font-semibold text-text-primary tabular-nums">{formatCost(row.costUsd)}</div>
        {costPct > 0 && (
          <div className="w-12 h-1 bg-surface-hover rounded-full overflow-hidden mt-1 ml-auto">
            <div className="h-full bg-brand-accent/70 rounded-full" style={{ width: `${costPct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
