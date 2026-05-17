"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useListWalletsQuery,
  useCreateWalletMutation,
  useCreateGroupMutation,
  useCreateChunkMutation,
} from "@/store/slices/promptsSlice";
import { SEED_TEMPLATES, type SeedWallet } from "@/lib/prompts/seedTemplates";
import { WalletSidebar } from "./WalletSidebar";
import { WalletDetail } from "./WalletDetail";
import { ComposeDrawer } from "./ComposeDrawer";

type ActivePane = "wallets" | "detail" | "compose";

export function WalletShell() {
  const { data: wallets = [], isLoading } = useListWalletsQuery();
  const [createWallet] = useCreateWalletMutation();
  const [createGroup] = useCreateGroupMutation();
  const [createChunk] = useCreateChunkMutation();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [activePane, setActivePane] = useState<ActivePane>("wallets");

  // Default to first wallet once loaded
  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedWalletId(id);
    setActivePane("detail");
  };

  const handleSeedWallet = async (template: SeedWallet) => {
    const walletResult = await createWallet({
      title: template.title,
      icon: template.icon,
      description: template.description,
    });
    if (!("data" in walletResult) || !walletResult.data) return;
    const walletId = walletResult.data.id;

    for (const group of template.groups) {
      const groupResult = await createGroup({
        walletId,
        title: group.title,
        description: group.description,
      });
      if (!("data" in groupResult) || !groupResult.data) continue;
      const groupId = groupResult.data.id;

      for (const chunk of group.chunks) {
        await createChunk({ groupId, title: chunk.title, content: chunk.content });
      }
    }

    setSelectedWalletId(walletId);
    setActivePane("detail");
  };

  const backButton = (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-brand-primary hover:bg-brand-light dark:hover:bg-brand-dark/30 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Home
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-[400px]">
        <div className="p-3 border-b border-border">{backButton}</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading wallets…</p>
          </div>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-[400px]">
        <div className="p-3 border-b border-border">{backButton}</div>
        <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-4xl mb-4">💼</p>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Create your first wallet</h2>
          <p className="text-text-muted mb-6 text-sm">
            Wallets organize your reusable prompt snippets into groups and chunks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {SEED_TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => handleSeedWallet(t)}
                className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl hover:border-brand-primary hover:bg-brand-light/50 dark:hover:bg-brand-dark/20 transition-all text-left shadow-sm"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.title}</p>
                  <p className="text-xs text-text-muted">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Back button bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-surface">{backButton}</div>

      {/* Desktop 3-pane layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr_300px] flex-1 overflow-hidden">
        <WalletSidebar
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onSelect={handleSelect}
        />
        <div className="overflow-y-auto">
          {selectedWallet ? (
            <WalletDetail wallet={selectedWallet} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-text-muted">
              Select a wallet
            </div>
          )}
        </div>
        <ComposeDrawer />
      </div>

      {/* Mobile: single pane + tab bar */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {activePane === "wallets" && (
            <WalletSidebar
              wallets={wallets}
              selectedWalletId={selectedWalletId}
              onSelect={handleSelect}
            />
          )}
          {activePane === "detail" && selectedWallet && (
            <WalletDetail wallet={selectedWallet} />
          )}
          {activePane === "compose" && <ComposeDrawer />}
        </div>

        {/* Mobile tab bar */}
        <div className="border-t border-border bg-surface flex items-center justify-around py-2">
          {(["wallets", "detail", "compose"] as ActivePane[]).map((pane) => (
            <button
              key={pane}
              onClick={() => setActivePane(pane)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
                activePane === pane ? "text-brand-primary" : "text-text-muted"
              }`}
            >
              <span>{pane === "wallets" ? "💼" : pane === "detail" ? "📝" : "✏️"}</span>
              <span className="capitalize">{pane}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
