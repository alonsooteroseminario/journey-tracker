"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface SharedChunk {
  id: string;
  title: string;
  content: string;
}

interface SharedGroup {
  id: string;
  title: string;
  description: string | null;
  chunks: SharedChunk[];
}

interface SharedWallet {
  id: string;
  title: string;
  icon: string | null;
  description: string | null;
  groups: SharedGroup[];
}

interface Props {
  wallet: SharedWallet;
  ownerName: string;
  shareToken?: string;
}

export function SharedWalletView({ wallet, ownerName, shareToken }: Props) {
  const { isSignedIn } = useUser();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  const handleCopy = async (chunk: SharedChunk) => {
    // Matches the fallback used elsewhere in this feature: clipboard.writeText
    // rejects on an insecure context or a denied permission, and copying is the
    // whole point of this page.
    try {
      await navigator.clipboard.writeText(chunk.content);
    } catch {
      const el = document.createElement("textarea");
      el.value = chunk.content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClone = async () => {
    if (!shareToken) return;
    setCloning(true);
    setCloneError(null);
    try {
      const res = await fetch(`/api/prompt-wallets/shared/${shareToken}/clone`, { method: "POST" });
      if (res.ok) {
        setCloned(true);
      } else if (res.status === 401) {
        setCloneError("Your session expired. Sign in again to save this wallet.");
      } else {
        setCloneError("Could not save this wallet. Please try again.");
      }
    } catch {
      setCloneError("Could not save this wallet. Please try again.");
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {wallet.icon && <span className="text-3xl">{wallet.icon}</span>}
            <h1 className="text-2xl font-bold text-text-primary">{wallet.title}</h1>
          </div>
          {wallet.description && (
            <p className="text-text-secondary text-sm">{wallet.description}</p>
          )}
          <p className="text-text-muted text-xs">Shared by {ownerName} · Read-only</p>
          {cloneError && (
            <p className="text-red-600 text-xs" role="alert">{cloneError}</p>
          )}
        </div>

        {/* Clone / Sign-in CTA */}
        {isSignedIn ? (
          cloned ? (
            <div className="flex-shrink-0 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              ✓ Copied to your account
            </div>
          ) : (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="flex-shrink-0 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary disabled:opacity-50 transition-colors"
            >
              {cloning ? "Copying…" : "Copy as my own"}
            </button>
          )
        ) : (
          <Link
            href="/sign-in"
            className="flex-shrink-0 px-4 py-2 border border-border-strong text-text-secondary rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
            aria-label="Sign in to save"
          >
            Sign in to save
          </Link>
        )}
      </div>

      {/* Groups */}
      {wallet.groups.map((group) => (
        <div key={group.id} className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-text-primary">{group.title}</h2>
          {group.description && (
            <p className="text-text-secondary text-sm">{group.description}</p>
          )}
          {group.chunks.map((chunk) => (
            <div key={chunk.id} className="bg-surface-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{chunk.title}</span>
                <button
                  onClick={() => handleCopy(chunk)}
                  className="text-xs px-2 py-1 rounded border border-border-strong text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  {copiedId === chunk.id ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap break-words font-mono">
                {chunk.content}
              </pre>
            </div>
          ))}
        </div>
      ))}

      {wallet.groups.length === 0 && (
        <p className="text-center text-text-muted py-8">This wallet has no groups yet.</p>
      )}
    </div>
  );
}
