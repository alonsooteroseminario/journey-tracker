import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";

/**
 * Get the current authenticated user from the database.
 * Creates the user record if it doesn't exist yet (first login).
 * Always syncs the latest name, email, and profileImage from Clerk.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Fetch the latest user data from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkId);

  // Extract user data from Clerk
  const name = clerkUser.fullName || clerkUser.firstName || "User";
  const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@placeholder.com`;
  const profileImage = clerkUser.imageUrl || null;

  // Use findUnique first for the common case (user already exists)
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // Auto-create user on first API call if not found
  if (!user) {
    let isNewUser = false;
    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          profileImage,
          streakData: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
              streakHistory: [],
            },
          },
        },
      });
      isNewUser = true;
    } catch (error) {
      // Handle race condition: another request created the user between our findUnique and create
      if ((error as any).code === "P2002") {
        user = await prisma.user.findUnique({
          where: { clerkId },
        });

        if (!user) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Send welcome email for new users (don't await to avoid blocking)
    if (isNewUser && user) {
      notify(user.id, "welcomeEmail", { userName: user.name }).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });
    }
  } else {
    // User exists - sync the latest data from Clerk
    // Only update if data has changed to avoid unnecessary database writes
    if (
      user.name !== name ||
      user.email !== email ||
      user.profileImage !== profileImage
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          email,
          profileImage,
        },
      });
    }
  }

  return user;
}
