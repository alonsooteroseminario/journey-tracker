import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { WalletShell } from "@/components/prompts/WalletShell";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Prompt Wallet",
  description: "Organize, compose, and reuse your AI prompts.",
};

/**
 * `/wallet` is public in middleware so a signed-out visitor lands on the
 * marketing page rather than a sign-in form. Only `auth()` is needed here to
 * answer "signed in?" — resolving the Prisma user would be a second round trip
 * on a question Clerk already answers.
 */
export default async function WalletPage() {
  const { userId } = await auth();

  if (!userId) return <LandingPage />;

  return (
    <main className="h-[calc(100vh-4rem)] overflow-hidden">
      <WalletShell />
    </main>
  );
}
