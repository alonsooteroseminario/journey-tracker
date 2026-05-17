import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SharedWalletView } from "@/components/prompts/SharedWalletView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedWalletPage({ params }: Props) {
  const { token } = await params;

  const wallet = await prisma.promptWallet.findFirst({
    where: { shareToken: token },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: { chunks: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!wallet) notFound();

  const owner = await prisma.user.findUnique({
    where: { id: wallet.userId },
    select: { name: true },
  });

  // Strip internal fields before passing to client component.
  const { userId: _uid, shareToken: _tok, ...publicWallet } = wallet;

  return (
    <main className="min-h-screen bg-app">
      <SharedWalletView
        wallet={publicWallet as Parameters<typeof SharedWalletView>[0]["wallet"]}
        ownerName={owner?.name ?? "Unknown"}
        shareToken={token}
      />
    </main>
  );
}
