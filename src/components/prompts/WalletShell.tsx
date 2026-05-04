"use client";

import { useState, useEffect } from "react";
import { useListWalletsQuery, useCreateWalletMutation } from "@/store/slices/promptsSlice";
import { SEED_TEMPLATES } from "@/lib/prompts/seedTemplates";
import { WalletSidebar } from "./WalletSidebar";
import { WalletDetail } from "./WalletDetail";
import { ComposeDrawer } from "./ComposeDrawer";

type ActivePane = "wallets" | "detail" | "compose";

export function WalletShell() {
  const { data: wallets = [], isLoading } = useListWalletsQuery();
  const [createWallet] = useCreateWalletMutation();
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

  const handleSeedWallet = async (title: string, icon: string) => {
    const result = await createWallet({ title, icon });
    if ("data" in result && result.data) {
      setSelectedWalletId(result.data.id);
      setActivePane("detail");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading wallets…</p>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center max-w-md px-4">
          <p className="text-4xl mb-4">💼</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your first wallet</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Wallets organize your reusable prompt snippets into groups and chunks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {SEED_TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => handleSeedWallet(t.title, t.icon)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-brand-primary hover:bg-brand-light/50 transition-all text-left shadow-sm"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Desktop 3-pane layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr_300px] flex-1 h-full overflow-hidden">
        <WalletSidebar
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          onSelect={handleSelect}
        />
        <div className="overflow-y-auto">
          {selectedWallet ? (
            <WalletDetail wallet={selectedWallet} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
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
        <div className="border-t border-gray-200 bg-white flex items-center justify-around py-2">
          {(["wallets", "detail", "compose"] as ActivePane[]).map((pane) => (
            <button
              key={pane}
              onClick={() => setActivePane(pane)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
                activePane === pane ? "text-brand-primary" : "text-gray-500"
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
