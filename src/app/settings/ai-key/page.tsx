import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentKeyForm } from "@/components/settings/AgentKeyForm";

export const metadata = { title: "AI Key — Journey Tracker" };

export default async function AiKeyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const cred = await prisma.lLMCredential.findFirst({
    where: { userId: user.id, provider: "anthropic" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">AI Agent Key</h1>
      <p className="text-text-secondary text-sm mb-6">
        Your personal Anthropic API key powers the chat agent. It is encrypted
        and stored securely — only your account uses it.
      </p>
      <div className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm">
        <AgentKeyForm
          hasKey={!!cred}
          maskedKey={cred?.maskedKey ?? null}
          lastValidated={cred?.lastSyncedAt?.toISOString() ?? null}
        />
      </div>
    </div>
  );
}
