"use client";

import { useState } from "react";
import { useUpdateWalletMutation } from "@/store/slices/promptsSlice";
import type { PromptWallet } from "@/types";

interface WalletHeaderProps {
  wallet: PromptWallet;
}

export function WalletHeader({ wallet }: WalletHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
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
    <div className="p-4 border-b border-gray-100 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editIcon}
          onChange={(e) => setEditIcon(e.target.value)}
          onBlur={handleIconBlur}
          className="w-10 text-center text-2xl bg-transparent border border-transparent hover:border-gray-200 focus:border-brand-primary rounded focus:outline-none"
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
            className="flex-1 text-xl font-semibold text-gray-800 bg-transparent border border-brand-primary rounded px-2 py-0.5 focus:outline-none"
            aria-label="Wallet title"
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-xl font-semibold text-gray-800 cursor-pointer hover:text-brand-primary transition-colors px-2 py-0.5"
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
        className="w-full text-sm text-gray-500 bg-transparent border border-transparent hover:border-gray-200 focus:border-brand-primary rounded px-2 py-1 resize-none focus:outline-none"
        aria-label="Wallet description"
      />
    </div>
  );
}
