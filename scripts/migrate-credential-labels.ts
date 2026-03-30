/**
 * Migration Script: Add label field to existing LLMCredential rows
 *
 * Sets label = "Default" on all existing LLMCredential documents that were
 * created before Phase 1 of the multi-provider credentials feature.
 *
 * Safe to run multiple times (idempotent via where filter).
 *
 * Prerequisites:
 *   1. Update prisma/schema.prisma (add label field, replace @@unique constraint)
 *   2. Run: npx prisma generate
 *   3. Back up your MongoDB collection before running this script
 *
 * Run with: npx tsx scripts/migrate-credential-labels.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting LLMCredential label migration...");

  // Find all credentials that don't have a label set (null or empty)
  const all = await prisma.lLMCredential.findMany({
    select: { id: true, userId: true, provider: true, label: true },
  });

  const needsMigration = all.filter(
    (c) => !c.label || c.label === ""
  );

  console.log(`Found ${all.length} total credentials, ${needsMigration.length} need label migration`);

  if (needsMigration.length === 0) {
    console.log("Nothing to migrate. All credentials already have labels.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const cred of needsMigration) {
    try {
      await prisma.lLMCredential.update({
        where: { id: cred.id },
        data: { label: "Default" },
      });
      updated++;
    } catch (e) {
      // Unique constraint violation: another credential for same (userId, provider) already has label "Default"
      // This shouldn't happen since old schema enforced one row per (userId, provider),
      // but handle defensively by appending provider name
      const providerLabel = `Default ${cred.provider}`;
      try {
        await prisma.lLMCredential.update({
          where: { id: cred.id },
          data: { label: providerLabel },
        });
        updated++;
        console.warn(`  Collision on "Default" for ${cred.provider} — used "${providerLabel}" for credential ${cred.id}`);
      } catch (e2) {
        console.error(`  Failed to migrate credential ${cred.id}:`, e2);
        skipped++;
      }
    }
  }

  console.log(`Migration complete: ${updated} updated, ${skipped} skipped`);

  if (skipped > 0) {
    console.error(`ERROR: ${skipped} credential(s) could not be migrated. Review errors above and retry.`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
