import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { hasFullAccess } from "@/lib/admin/auth";
import { LandingPage } from "@/components/LandingPage";
import { HomeDashboard } from "@/components/HomeDashboard";

/**
 * Overrides the root layout's Cadence title for `/`.
 *
 * Crawlers and link unfurlers are always signed out, so what they render here
 * is the Prompt Wallet landing page — the title and description have to match
 * it. A full-access user loading their dashboard at `/` sees this title too;
 * that is the accepted cost of keeping the public surface coherent, and the
 * alternative (generateMetadata) would cost a second Clerk + Prisma round trip
 * on every render of this route.
 */
export const metadata: Metadata = {
  title: "Prompt Wallet — Your prompts, actually organized",
  description:
    "Keep every reusable AI prompt in a wallet, break it into chunks, and compose the one you need in seconds. Free forever.",
  keywords: ["prompt library", "prompt manager", "AI prompts", "prompt organizer", "prompt wallet"],
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) return <LandingPage />;
  if (!hasFullAccess(user)) redirect("/wallet");

  return <HomeDashboard />;
}
