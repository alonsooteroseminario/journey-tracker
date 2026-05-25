"use client";

import { useState } from "react";

interface DiscordWebhookFormProps {
  initialUrl: string | null;
}

const DISCORD_URL_PREFIX = "https://discord.com/api/webhooks/";
const DISCORD_ALT_PREFIX = "https://discordapp.com/api/webhooks/";

function isValidDiscordUrl(url: string): boolean {
  return url.startsWith(DISCORD_URL_PREFIX) || url.startsWith(DISCORD_ALT_PREFIX);
}

export function DiscordWebhookForm({ initialUrl }: DiscordWebhookFormProps) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error" | "pinging" | "ping-ok" | "ping-fail">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDirty = url !== (initialUrl ?? "");
  const hasUrl = !!initialUrl;

  const handleSave = async () => {
    const trimmed = url.trim();
    if (trimmed && !isValidDiscordUrl(trimmed)) {
      setStatus("error");
      setErrorMsg("Must be a Discord webhook URL (https://discord.com/api/webhooks/…)");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discordWebhookUrl: trimmed || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const details = (data as { details?: { message: string }[] }).details;
        setErrorMsg(details?.[0]?.message ?? (data as { error?: string }).error ?? "Failed to save");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  };

  const handleClear = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discordWebhookUrl: null }),
      });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Failed to remove webhook.");
        return;
      }
      setUrl("");
      setStatus("idle");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  };

  const handleTestPing = async () => {
    const target = url.trim() || initialUrl;
    if (!target || !isValidDiscordUrl(target)) return;
    setStatus("pinging");
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "Cadence — Test Ping",
              description: "Your Discord webhook is connected. Reminders will appear here.",
              color: 0x5b50e8,
              footer: { text: "Cadence · cadence.app" },
            },
          ],
        }),
      });
      setStatus(res.ok ? "ping-ok" : "ping-fail");
    } catch {
      setStatus("ping-fail");
    }
  };

  const currentUrl = url.trim();
  const canPing = !!(currentUrl && isValidDiscordUrl(currentUrl)) || !!(initialUrl && !isDirty);

  return (
    <div className="space-y-4">
      {hasUrl && !isDirty && (
        <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg border border-border">
          <span className="text-text-muted font-mono text-xs truncate flex-1">
            {initialUrl!.replace(/\/[^/]+$/, "/••••••••")}
          </span>
          <span className="ml-auto text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/30 shrink-0">
            Connected
          </span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="discord-webhook-input" className="block text-sm font-medium text-text-secondary">
          {hasUrl ? "Replace webhook URL" : "Discord webhook URL"}
        </label>
        <input
          id="discord-webhook-input"
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setStatus("idle"); setErrorMsg(""); }}
          placeholder="https://discord.com/api/webhooks/…"
          className="w-full px-4 py-2 border border-border-strong rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
        {status === "success" && <p className="text-sm text-green-600">✓ Webhook saved.</p>}
        {status === "ping-ok" && <p className="text-sm text-green-600">✓ Test message sent — check your channel!</p>}
        {status === "ping-fail" && <p className="text-sm text-red-600">Ping failed — double-check the webhook URL.</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={!isDirty || status === "saving"}
          className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "Saving…" : "Save Webhook"}
        </button>

        {canPing && (
          <button
            onClick={handleTestPing}
            disabled={status === "pinging" || status === "saving"}
            className="px-4 py-2 border border-border-strong text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "pinging" ? "Sending…" : "Send test ping"}
          </button>
        )}

        {hasUrl && !isDirty && (
          <button
            onClick={handleClear}
            disabled={status === "saving"}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted">
        In Discord, go to your channel settings → Integrations → Webhooks → New Webhook, then copy the URL here.
        Reminders will mirror to that channel whenever your streak or tasks need attention.
      </p>
    </div>
  );
}
