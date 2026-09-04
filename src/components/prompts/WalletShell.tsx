"use client";

import { useState, useEffect } from "react";
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
  const { data: wallets = [], isLoading, isError, refetch } = useListWalletsQuery();
  const [createWallet] = useCreateWalletMutation();
  const [createGroup] = useCreateGroupMutation();
  const [createChunk] = useCreateChunkMutation();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [activePane, setActivePane] = useState<ActivePane>("wallets");
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Select the first wallet once loaded, and recover if the selected one
  // disappears (deleted here or in another tab) — guarding on `selectedWalletId`
  // alone would leave the detail pane empty forever after a delete.
  useEffect(() => {
    const stillExists = wallets.some((w) => w.id === selectedWalletId);
    if (!stillExists && wallets.length > 0) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedWalletId(id);
    setActivePane("detail");
  };

  const handleSeedWallet = async (template: SeedWallet) => {
    if (seeding) return; // ~10 sequential writes; a second click would duplicate the wallet
    setSeeding(true);
    setSeedError(null);
    try {
      const walletResult = await createWallet({
        title: template.title,
        icon: template.icon,
        description: template.description,
      });
      if (!("data" in walletResult) || !walletResult.data) {
        setSeedError("Could not create the wallet. Please try again.");
        return;
      }
      const walletId = walletResult.data.id;

      let partial = false;
      for (const group of template.groups) {
        const groupResult = await createGroup({
          walletId,
          title: group.title,
          description: group.description,
        });
        if (!("data" in groupResult) || !groupResult.data) {
          partial = true;
          continue;
        }
        const groupId = groupResult.data.id;

        for (const chunk of group.chunks) {
          const chunkResult = await createChunk({
            groupId,
            title: chunk.title,
            content: chunk.content,
          });
          if (!("data" in chunkResult) || !chunkResult.data) partial = true;
        }
      }

      // A half-built wallet is indistinguishable from a complete one, so say so.
      if (partial) setSeedError("Some prompts could not be added. Check the wallet below.");
      setSelectedWalletId(walletId);
      setActivePane("detail");
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-[400px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading wallets…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full min-h-[400px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-4">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold text-text-primary mb-2">Could not load your wallets</h2>
            <p className="text-text-muted mb-6 text-sm">
              This is a loading problem, not a sign that your wallets are gone.
              Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-[400px]">
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
                  disabled={seeding}
                  className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl hover:border-brand-primary hover:bg-brand-light/50 dark:hover:bg-brand-dark/20 transition-all text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t.title}</p>
                    <p className="text-xs text-text-muted">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
            {seeding && (
              <p className="mt-4 text-sm text-text-muted" role="status">Setting up your wallet…</p>
            )}
            {seedError && (
              <p className="mt-4 text-sm text-red-600" role="alert">{seedError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Desktop 3-pane layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr_300px] flex-1 overflow-hidden">
        <WalletSidebar
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onSelect={handleSelect}
        />
        <div className="overflow-y-auto">
          {selectedWallet ? (
            <WalletDetail key={selectedWallet.id} wallet={selectedWallet} />
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
            <WalletDetail key={selectedWallet.id} wallet={selectedWallet} />
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
