import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/credentials/encrypt";

/**
 * Fetches the user's stored Anthropic API key from the database and
 * decrypts it. Returns null if no credential is saved or decryption fails.
 *
 * The most-recently-updated credential is used (supports future multi-key
 * scenarios where the UI lets the user choose an active key).
 */
export async function getUserAgentKey(userId: string): Promise<string | null> {
  const cred = await prisma.lLMCredential.findFirst({
    where: { userId, provider: "anthropic" },
    orderBy: { updatedAt: "desc" },
  });
  if (!cred) return null;
  try {
    return decryptKey(cred.encryptedKey, cred.iv);
  } catch (err) {
    console.warn(`getUserAgentKey: decryption failed for user ${userId}`, err);
    return null;
  }
}
