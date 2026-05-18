"use client";

import { useState } from "react";
import { useUpdateWalletMutation } from "@/store/slices/promptsSlice";
import { ShareWalletModal } from "./ShareWalletModal";
import type { PromptWallet } from "@/types";

interface WalletHeaderProps {
  wallet: PromptWallet;
}

export function WalletHeader({ wallet }: WalletHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editTitle, setEditTitle] = useState(wallet.title);
  const [editDescription, setEditDescription] = useState(wallet.description ?? "");
  const [editIcon, setEditIcon] = useState(wallet.icon ?? "");

  const [updateWallet] = useUpdateWalletMutation();

  const handleTitleBlur = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== wallet.title) {
      updateWallet({ id: wallet.id, patch: { title: trimmed } });
    } else {
      setEditTitle(wallet.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    const val = editDescription.trim();
    if (val !== (wallet.description ?? "")) {
      updateWallet({ id: wallet.id, patch: { description: val || undefined } });
    }
  };

  const handleIconBlur = () => {
    const val = editIcon.trim();
    if (val !== (wallet.icon ?? "")) {
      updateWallet({ id: wallet.id, patch: { icon: val || undefined } });
    }
  };

  return (
    <div className="p-4 border-b border-border space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editIcon}
          onChange={(e) => setEditIcon(e.target.value)}
          onBlur={handleIconBlur}
          className="w-10 text-center text-2xl bg-transparent border border-transparent hover:border-border focus:border-brand-primary rounded focus:outline-none"
          placeholder="💼"
          aria-label="Wallet icon"
          maxLength={4}
        />
        {isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") { setEditTitle(wallet.title); setIsEditingTitle(false); }
            }}
            className="flex-1 text-xl font-semibold text-text-primary bg-transparent border border-brand-primary rounded px-2 py-0.5 focus:outline-none"
            aria-label="Wallet title"
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-xl font-semibold text-text-primary cursor-pointer hover:text-brand-primary transition-colors px-2 py-0.5"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit title"
          >
            {wallet.title}
          </h2>
        )}
      </div>
      <textarea
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Add a description…"
        rows={2}
        className="w-full text-sm text-text-muted bg-transparent border border-transparent hover:border-border focus:border-brand-primary rounded px-2 py-1 resize-none focus:outline-none"
        aria-label="Wallet description"
      />

      {/* Share button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowShareModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-colors ${
            (wallet as unknown as { shareToken?: string | null }).shareToken
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "border border-border-strong text-text-secondary hover:bg-surface-hover"
          }`}
          aria-label="Share wallet"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {(wallet as unknown as { shareToken?: string | null }).shareToken ? "Shared" : "Share"}
        </button>
      </div>

      {showShareModal && (
        <ShareWalletModal
          wallet={wallet as unknown as { id: string; title: string; shareToken: string | null }}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
