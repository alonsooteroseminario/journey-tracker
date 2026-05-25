import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentKeyForm } from "@/components/settings/AgentKeyForm";
import { AgentUsageStats } from "@/components/settings/AgentUsageStats";
import { DiscordWebhookForm } from "@/components/settings/DiscordWebhookForm";

export const metadata = { title: "AI Settings — Cadence" };

export default async function AiKeyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const cred = await prisma.lLMCredential.findFirst({
    where: { userId: user.id, provider: "anthropic" },
    orderBy: { updatedAt: "desc" },
  });

  const emailPrefs = await prisma.emailPreferences.findUnique({
    where: { userId: user.id },
    select: { discordWebhookUrl: true },
  });

  // Quick summary from the last 30 days for the server-rendered header
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usageSummary = await prisma.costTransaction.aggregate({
    where: {
      userId: user.id,
      source: "auto-anthropic",
      date: { gte: thirtyDaysAgo },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalCost30d = usageSummary._sum.amount ?? 0;
  const totalRequests30d = usageSummary._count.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">AI Agent Settings</h1>
        <p className="text-text-secondary text-sm">
          Configure your Anthropic API key and monitor live token usage and cost.
        </p>
      </div>

      {/* Key configuration */}
      <div className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔑</span>
          <h2 className="text-base font-semibold text-text-primary">Anthropic API Key</h2>
          {cred && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/30">
              Active
            </span>
          )}
        </div>
        <AgentKeyForm
          hasKey={!!cred}
          maskedKey={cred?.maskedKey ?? null}
          lastValidated={cred?.lastSyncedAt?.toISOString() ?? null}
        />
      </div>

      {/* 30-day at-a-glance (server-rendered for instant load) */}
      {totalRequests30d > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-2 flex items-center gap-6 text-sm">
          <div>
            <span className="font-semibold text-brand-primary">
              ${totalCost30d.toFixed(4)}
            </span>
            <span className="text-text-muted ml-1">this month</span>
          </div>
          <div className="text-border">|</div>
          <div>
            <span className="font-semibold text-text-primary">{totalRequests30d}</span>
            <span className="text-text-muted ml-1">API calls (30d)</span>
          </div>
          <div className="text-border">|</div>
          <div className="text-text-muted text-xs">Updates every 30s ↓</div>
        </div>
      )}

      {/* Live usage stats (client-rendered, auto-refresh) */}
      <AgentUsageStats />

      {/* Discord webhook configuration */}
      <div className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔔</span>
          <h2 className="text-base font-semibold text-text-primary">Discord Notifications</h2>
          {emailPrefs?.discordWebhookUrl && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/30">
              Connected
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Mirror your task and streak reminders to a Discord channel. Each reminder email will also
          post a rich embed to your chosen channel.
        </p>
        <DiscordWebhookForm initialUrl={emailPrefs?.discordWebhookUrl ?? null} />
      </div>
    </div>
  );
}
