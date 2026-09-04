"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "./Header";
import { useHeaderStats } from "@/hooks/useHeaderStats";
import { useFullAccess } from "./AccessProvider";

/** Routes where the app header is intentionally absent. */
const NO_HEADER_PREFIXES = ["/sign-in", "/sign-up", "/wallet/share"];

/** Routes that render `<LandingPage>` when signed out. It has its own nav. */
const LANDING_ROUTES = ["/", "/wallet"];

/**
 * Full-access users get the stats (progress/streak) fetched via
 * `useHeaderStats`, which pulls goals/friends/streaks/activity/profile data.
 * Free users never see those numbers, so this is only mounted when
 * `fullAccess` is true — keeping that fetch off every free-user navigation.
 */
function HeaderWithStats() {
  const stats = useHeaderStats();
  return <Header totalProgress={stats.progress} currentStreak={stats.streak} />;
}

/**
 * Renders `<Header>` exactly once inside `AppShell`, so every
 * authenticated route (including /wallet) gets consistent app chrome
 * without each page managing its own Header import.
 *
 * Returns null for:
 * - Clerk not yet loaded (avoids SSR mismatch)
 * - Signed-out user on a route that renders the landing page (marketing surface)
 * - Auth pages and public share pages (see NO_HEADER_PREFIXES)
 */
export function HeaderHost() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const fullAccess = useFullAccess();

  if (!isLoaded) return null;
  if (!isSignedIn && LANDING_ROUTES.includes(pathname ?? "")) return null;
  if (NO_HEADER_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return fullAccess ? <HeaderWithStats /> : <Header />;
}
