"use client";

import { useState } from "react";

interface AgentKeyFormProps {
  hasKey: boolean;
  maskedKey: string | null;
  lastValidated: string | null;
  onSaved?: () => void;
}

export function AgentKeyForm({ hasKey, maskedKey, lastValidated, onSaved }: AgentKeyFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/settings/ai-key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error || "Failed to save key");
        setStatus("error");
        return;
      }
      setApiKey("");
      setStatus("success");
      onSaved?.();
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch("/api/settings/ai-key", { method: "DELETE" });
      setShowRemoveConfirm(false);
      onSaved?.();
    } catch {
      // ignore — page will refresh
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg border border-border">
            <span className="text-text-muted font-mono text-sm">{maskedKey}</span>
            <span className="ml-auto text-xs text-text-muted">
              {lastValidated
                ? `Validated ${new Date(lastValidated).toLocaleDateString()}`
                : "Saved"}
            </span>
          </div>

          {!showRemoveConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setStatus("idle")}
                className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-medium"
              >
                Replace Key
              </button>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="px-4 py-2 text-sm border border-border-strong text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-700">Remove key? Chat will be gated.</span>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="ml-auto px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {removing ? "Removing…" : "Yes, remove"}
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-3 py-1 text-sm border border-border-strong text-text-secondary rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          ⚠ You need an Anthropic API key to chat with your agent.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary">
          {hasKey ? "New Anthropic API key" : "Anthropic API key"}
        </label>
        <input
          id="api-key-input"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setStatus("idle"); }}
          placeholder="sk-ant-…"
          className="w-full px-4 py-2 border border-border-strong rounded-lg text-sm bg-surface text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}
        {status === "success" && (
          <p className="text-sm text-green-600">✓ Key saved and verified.</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!apiKey.trim() || status === "saving"}
        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "saving" ? "Validating…" : "Save Key"}
      </button>

      <p className="text-xs text-text-muted">
        Your key is encrypted at rest. We never log it.{" "}
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-primary"
        >
          Get a key at console.anthropic.com
        </a>
      </p>
    </div>
  );
}
