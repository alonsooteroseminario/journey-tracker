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
