import type { Metadata } from "next";
import { WalletShell } from "@/components/prompts/WalletShell";

export const metadata: Metadata = {
  title: "Prompt Wallet",
  description: "Organize, compose, and reuse your AI prompts.",
};

export default function WalletPage() {
  return (
    <main className="h-[calc(100vh-4rem)] overflow-hidden">
      <WalletShell />
    </main>
  );
}
