import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated user from the database.
 * Creates the user record if it doesn't exist yet (first login).
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Use findUnique first for the common case (user already exists)
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // Auto-create user on first API call if not found
  // (handles case where webhook hasn't fired yet)
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: `${clerkId}@placeholder.com`, // Will be updated by webhook
          name: "New User",
          streakData: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
              streakHistory: [],
            },
          },
        },
      });
    } catch (error) {
      // Handle race condition: another request created the user between our findUnique and create
      // Retry the findUnique to get the user that was just created
      if ((error as any).code === "P2002") {
        // Prisma unique constraint violation
        user = await prisma.user.findUnique({
          where: { clerkId },
        });
        
        if (!user) {
          // This should never happen, but if it does, throw the original error
          throw error;
        }
      } else {
        // Some other error occurred, re-throw it
        throw error;
      }
    }
  }

  return user;
}
