"use client";

import { useState } from "react";
import {
  useShareWalletMutation,
  useUnshareWalletMutation,
  useRotateShareTokenMutation,
} from "@/store/slices/promptsSlice";

interface MinimalWallet {
  id: string;
  title: string;
  shareToken: string | null;
}

interface Props {
  wallet: MinimalWallet;
  onClose: () => void;
}

function buildShareUrl(token: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/wallet/share/${token}`;
}

export function ShareWalletModal({ wallet, onClose }: Props) {
  const [shareWallet] = useShareWalletMutation();
  const [unshareWallet] = useUnshareWalletMutation();
  const [rotateShareToken] = useRotateShareTokenMutation();

  const [currentToken, setCurrentToken] = useState<string | null>(wallet.shareToken);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const shareUrl = currentToken ? buildShareUrl(currentToken) : null;

  const handleEnable = async () => {
    setBusy(true);
    const result = await shareWallet(wallet.id);
    if ("data" in result && result.data) {
      setCurrentToken(result.data.shareToken);
    }
    setBusy(false);
  };

  const handleStop = async () => {
    setBusy(true);
    await unshareWallet(wallet.id);
    setCurrentToken(null);
    setBusy(false);
  };

  const handleRotate = async () => {
    setBusy(true);
    const result = await rotateShareToken(wallet.id);
    if ("data" in result && result.data) {
      setCurrentToken(result.data.shareToken);
    }
    setBusy(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50">
      <div className="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Share "{wallet.title}"</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status */}
        {!currentToken ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Private</span> — only you can see this wallet.
            </p>
            <button
              onClick={handleEnable}
              disabled={busy}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary disabled:opacity-50 transition-colors"
            >
              Generate share link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Anyone with this link can <strong>view</strong> your wallet (read-only).
              Signed-in viewers can also copy it to their own account.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl ?? ""}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary"
              />
              <button
                onClick={handleCopy}
                aria-label="Copy link"
                className="px-3 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <p className="text-xs text-text-muted">
              ⚠ Anyone with this link can view all groups and chunks. They cannot edit.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRotate}
                disabled={busy}
                className="px-3 py-1.5 text-sm border border-border-strong text-text-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Rotate link
              </button>
              <button
                onClick={handleStop}
                disabled={busy}
                className="px-3 py-1.5 text-sm border border-border-strong text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Stop sharing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
