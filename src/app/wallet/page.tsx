import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { WalletShell } from "@/components/prompts/WalletShell";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Prompt Wallet — Save the prompts that work",
  description:
    "Keep every reusable AI prompt in one place, break it into chunks, and compose the one you need in seconds. Free beta, no card needed.",
  // Signed-out visitors get the same <LandingPage /> as `/`, so without this
  // Google indexes two URLs with identical HTML and picks the winner itself.
  alternates: { canonical: "/" },
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
