import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/credentials/encrypt";

/**
 * Fetches the user's stored Anthropic API key given their Clerk userId.
 * Resolves clerkId → Prisma User → LLMCredential → decrypted key.
 * Returns null if no credential is saved, user is unknown, or decryption fails.
 */
export async function getUserAgentKey(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  const cred = await prisma.lLMCredential.findFirst({
    where: { userId: user.id, provider: "anthropic" },
    orderBy: { updatedAt: "desc" },
  });
  if (!cred) return null;
  try {
    return decryptKey(cred.encryptedKey, cred.iv);
  } catch (err) {
    console.warn(`getUserAgentKey: decryption failed for user ${clerkId}`, err);
    return null;
  }
}
