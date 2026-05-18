"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "./Header";
import { useHeaderStats } from "@/hooks/useHeaderStats";

/** Routes where the app header is intentionally absent. */
const NO_HEADER_PREFIXES = ["/sign-in", "/sign-up", "/wallet/share"];

/**
 * Renders `<Header>` exactly once inside `AppShell`, so every
 * authenticated route (including /wallet) gets consistent app chrome
 * without each page managing its own Header import.
 *
 * Returns null for:
 * - Clerk not yet loaded (avoids SSR mismatch)
 * - Signed-out user on the landing page (marketing surface)
 * - Auth pages and public share pages (see NO_HEADER_PREFIXES)
 */
export function HeaderHost() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const stats = useHeaderStats();

  if (!isLoaded) return null;
  if (pathname === "/" && !isSignedIn) return null;
  if (NO_HEADER_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return <Header totalProgress={stats.progress} currentStreak={stats.streak} />;
}
