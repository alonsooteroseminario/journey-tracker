"use client";

import { useState } from "react";
import type { CredentialItem } from "../hooks/useCostTracker";

interface CredentialsProps {
  credentials: CredentialItem[];
  onAdd: (provider: string, apiKey: string) => Promise<void>;
  onDelete: (provider: string) => Promise<void>;
  onSync: (provider: string) => Promise<void>;
}

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🤖",
    placeholder: "sk-ant-api03-...",
    /** Manual “Sync” calls the provider API; Anthropic usage is auto-logged from the AI agent instead. */
    syncSupported: false,
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    icon: "🔊",
    placeholder: "sk_...",
    syncSupported: true,
  },
] as const;

const CURSOR_PROVIDER = { id: "cursor", name: "Cursor", icon: "⌨️" };

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Credentials({ credentials, onAdd, onDelete, onSync }: CredentialsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncMessages, setSyncMessages] = useState<Record<string, string>>({});
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  const connectedMap = Object.fromEntries(credentials.map((c) => [c.provider, c]));

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onAdd(selectedProvider, apiKey.trim());
      setIsModalOpen(false);
      setApiKey("");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async (provider: string) => {
    setSyncingProvider(provider);
    setSyncMessages((prev) => ({ ...prev, [provider]: "" }));
    try {
      const result = await onSync(provider) as Record<string, unknown> | undefined;
      const synced = typeof result?.synced === "number" ? result.synced : undefined;
      const msg = synced !== undefined
        ? `Synced ${synced} new record${synced !== 1 ? "s" : ""}`
        : "Synced";
      setSyncMessages((prev) => ({ ...prev, [provider]: msg }));
    } catch (err: unknown) {
      setSyncMessages((prev) => ({
        ...prev,
        [provider]: err instanceof Error ? err.message : "Sync failed",
      }));
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleDelete = async (provider: string) => {
    setDeletingProvider(provider);
    try {
      await onDelete(provider);
    } finally {
      setDeletingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">API Credentials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Keys are encrypted at rest and never returned to the client.
          </p>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setSaveError(null); setApiKey(""); }}
          className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add API Key
        </button>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map((p) => {
          const cred = connectedMap[p.id];
          const syncing = syncingProvider === p.id;
          const deleting = deletingProvider === p.id;
          const syncMsg = syncMessages[p.id];

          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    {cred ? (
                      <p className="text-xs font-mono text-gray-500 mt-0.5">{cred.maskedKey}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Not connected</p>
                    )}
                  </div>
                </div>

                {cred ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.syncSupported ? (
                      <button
                        onClick={() => handleSync(p.id)}
                        disabled={syncing}
                        className="px-3 py-1.5 text-xs font-medium bg-brand-light text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {syncing ? (
                          <span className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Sync Now
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 max-w-[14rem] text-right leading-snug">
                        Usage is logged automatically when you use the in-app AI agent.
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setApiKey("");
                      setSaveError(null);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>

              {cred?.lastSyncedAt && (
                <p className="text-xs text-gray-400 mt-3 ml-11">
                  Last synced: {timeAgo(cred.lastSyncedAt)}
                </p>
              )}
              {syncMsg && p.syncSupported && (
                <p
                  className={`text-xs mt-2 ml-11 ${
                    /^Synced/.test(syncMsg) ? "text-brand-primary" : "text-red-500"
                  }`}
                >
                  {syncMsg}
                </p>
              )}
            </div>
          );
        })}

        {/* Cursor — manual only */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{CURSOR_PROVIDER.icon}</span>
            <div>
              <p className="font-semibold text-gray-800">{CURSOR_PROVIDER.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Subscription service — no public API. Enter costs manually via Add Transaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add API Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Add API Key</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                {saveError && <p className="text-xs text-red-500 mt-1.5">{saveError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !apiKey.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
