import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

/**
 * Check if a user is an admin based on email whitelist
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;

  const adminEmail = process.env.OWNER_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("OWNER_ADMIN_EMAIL not configured");
    return false;
  }

  return user.email === adminEmail;
}

/**
 * Get the current user and check if they are an admin
 * Redirects to home page if not authenticated or not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!isAdmin(user)) {
    redirect("/");
  }

  return user;
}

/**
 * Full-access users see the complete Cadence app; everyone else gets the
 * standalone Prompt Wallet. The admin always qualifies.
 *
 * FULL_ACCESS_EMAILS is a comma-separated allowlist and is optional — while
 * unset, the OWNER_ADMIN_EMAIL admin is the only full-access account.
 */
export function hasFullAccess(user: User | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const allow = (process.env.FULL_ACCESS_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return allow.includes(user.email.toLowerCase());
}

/**
 * Server-side guard for full-access routes. Redirects free users to /wallet.
 */
export async function requireFullAccess(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!hasFullAccess(user)) {
    redirect("/wallet");
  }

  return user;
}
