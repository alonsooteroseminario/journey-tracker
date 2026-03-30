"use client";

import { useState } from "react";
import type { CredentialItem } from "../hooks/useCostTracker";

interface CredentialsProps {
  credentials: CredentialItem[];
  onAdd: (provider: string, apiKey: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSync: (provider: string, credentialId: string) => Promise<unknown>;
  onValidate: (provider: string, credentialId: string) => Promise<{ valid: boolean; keyType: string }>;
  onEdit: (id: string, data: { label?: string; apiKey?: string }) => Promise<void>;
}

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🤖",
    placeholder: "sk-ant-api03-... or sk-ant-admin-...",
    syncSupported: false,   // standard keys; admin keys show Sync separately
    validateSupported: true,
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    icon: "🔊",
    placeholder: "sk_...",
    syncSupported: true,
    validateSupported: true,
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

export function Credentials({ credentials, onAdd, onDelete, onSync, onValidate, onEdit }: CredentialsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessages, setSyncMessages] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validateMessages, setValidateMessages] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [editingCred, setEditingCred] = useState<CredentialItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openModal = (providerId?: string) => {
    setSelectedProvider(providerId ?? "anthropic");
    setApiKey("");
    setLabel("");
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !label.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onAdd(selectedProvider, apiKey.trim(), label.trim());
      setIsModalOpen(false);
      setApiKey("");
      setLabel("");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async (cred: CredentialItem) => {
    setSyncingId(cred.id);
    setSyncMessages((prev) => ({ ...prev, [cred.id]: "" }));
    try {
      const result = (await onSync(cred.provider, cred.id)) as Record<string, unknown> | undefined;
      const synced = typeof result?.synced === "number" ? result.synced : undefined;
      const msg =
        synced !== undefined
          ? `Synced ${synced} new record${synced !== 1 ? "s" : ""}`
          : "Synced";
      setSyncMessages((prev) => ({ ...prev, [cred.id]: msg }));
    } catch (err: unknown) {
      setSyncMessages((prev) => ({
        ...prev,
        [cred.id]: err instanceof Error ? err.message : "Sync failed",
      }));
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleValidate = async (cred: CredentialItem) => {
    setValidatingId(cred.id);
    setValidateMessages((prev) => ({ ...prev, [cred.id]: { text: "", ok: false } }));
    try {
      const result = await onValidate(cred.provider, cred.id);
      const label = result.keyType === "admin" ? "Valid admin key" : "Valid API key";
      setValidateMessages((prev) => ({ ...prev, [cred.id]: { text: label, ok: true } }));
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Validation failed";
      setValidateMessages((prev) => ({ ...prev, [cred.id]: { text, ok: false } }));
    } finally {
      setValidatingId(null);
    }
  };

  const openEditModal = (cred: CredentialItem) => {
    setEditingCred(cred);
    setEditLabel(cred.label);
    setEditApiKey("");
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editingCred) return;
    const data: { label?: string; apiKey?: string } = {};
    if (editLabel.trim() && editLabel.trim() !== editingCred.label) {
      data.label = editLabel.trim();
    }
    if (editApiKey.trim()) {
      data.apiKey = editApiKey.trim();
    }
    if (!data.label && !data.apiKey) {
      setEditError("Change at least one field.");
      return;
    }
    setIsEditing(true);
    setEditError(null);
    try {
      await onEdit(editingCred.id, data);
      setEditingCred(null);
      setEditApiKey("");
      setEditLabel("");
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsEditing(false);
    }
  };

  // Group credentials by provider
  const credsByProvider = PROVIDERS.map((p) => ({
    provider: p,
    items: credentials.filter((c) => c.provider === p.id),
  }));

  const hasAnyCredential = credentials.length > 0;

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
          onClick={() => openModal()}
          className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add API Key
        </button>
      </div>

      {!hasAnyCredential && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-400 text-sm">No credentials yet</p>
          <button
            onClick={() => openModal()}
            className="mt-3 px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-light transition-colors"
          >
            Add your first key
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {credsByProvider.map(({ provider: p, items }) => (
          <div key={p.id}>
            {/* Provider section header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                {!p.syncSupported && !("validateSupported" in p && p.validateSupported) && (
                  <span className="text-xs text-gray-400 font-normal">
                    · Usage logged automatically from AI agent
                  </span>
                )}
              </div>
              <button
                onClick={() => openModal(p.id)}
                className="text-xs text-brand-primary hover:underline"
              >
                + Add key
              </button>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400">Not connected</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {items.map((cred) => {
                  const syncing = syncingId === cred.id;
                  const deleting = deletingId === cred.id;
                  const validating = validatingId === cred.id;
                  const syncMsg = syncMessages[cred.id];
                  const validateMsg = validateMessages[cred.id];
                  const isAdminKey = cred.keyType === "admin";

                  return (
                    <div
                      key={cred.id}
                      className="bg-white rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800 truncate">{cred.label}</p>
                            {cred.keyType && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                isAdminKey
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}>
                                {isAdminKey ? "admin" : "standard"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">{cred.maskedKey}</p>
                          {cred.lastSyncedAt && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Last synced: {timeAgo(cred.lastSyncedAt)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* ElevenLabs sync */}
                          {p.syncSupported && (
                            <button
                              onClick={() => handleSync(cred)}
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
                              Sync
                            </button>
                          )}
                          {/* Anthropic admin key sync (Phase 3B) */}
                          {p.id === "anthropic" && isAdminKey && (
                            <button
                              onClick={() => handleSync(cred)}
                              disabled={syncing}
                              className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {syncing ? (
                                <span className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                              Sync
                            </button>
                          )}
                          {/* Anthropic validate button (Phase 3A) */}
                          {"validateSupported" in p && p.validateSupported && (
                            <button
                              onClick={() => handleValidate(cred)}
                              disabled={validating}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {validating ? (
                                <span className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                              ) : "Test"}
                            </button>
                          )}
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(cred)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                            title="Edit label or replace API key"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cred.id)}
                            disabled={deleting}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deleting ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </div>

                      {syncMsg && (
                        <p
                          className={`text-xs mt-2 ${
                            /^Synced/.test(syncMsg) ? "text-brand-primary" : "text-red-500"
                          }`}
                        >
                          {syncMsg}
                        </p>
                      )}
                      {validateMsg?.text && (
                        <p className={`text-xs mt-2 ${validateMsg.ok ? "text-green-600" : "text-red-500"}`}>
                          {validateMsg.ok ? "✓ " : "✗ "}{validateMsg.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Cursor — manual-only, no credentials */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{CURSOR_PROVIDER.icon}</span>
            <span className="text-sm font-semibold text-gray-700">{CURSOR_PROVIDER.name}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">
              Subscription service — no public API. Enter costs manually via Add Transaction.
            </p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Work, Personal, Client A"
                  maxLength={64}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
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
                  disabled={isSaving || !apiKey.trim() || !label.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credential Modal */}
      {editingCred && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Edit Credential</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingCred.provider} · {editingCred.maskedKey}</p>
              </div>
              <button
                onClick={() => setEditingCred(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  maxLength={64}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Replace API Key <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder={editingCred.maskedKey}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                />
                {editError && <p className="text-xs text-red-500 mt-1.5">{editError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCred(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isEditing ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
