"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMigrateLocalDataMutation } from "@/store/slices/goalsSlice";

const STORAGE_KEY = "journey-tracker-state";
const MIGRATED_KEY = "journey-tracker-migrated-to-db";

/**
 * AutoMigration - Automatically migrates localStorage data to MongoDB
 * on the user's first authenticated session.
 *
 * Renders a loading overlay during migration, then disappears.
 */
export function AutoMigration() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [migrateData, { isLoading }] = useMigrateLocalDataMutation();
  const [migrationDone, setMigrationDone] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "idle" | "migrating" | "done" | "skipped"
  >("idle");

  useEffect(() => {
    if (!clerkLoaded || !user || migrationDone) return;

    // Check if already migrated
    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
    if (alreadyMigrated) {
      setMigrationDone(true);
      setMigrationStatus("skipped");
      return;
    }

    // Check if there's any localStorage data worth migrating
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, "true");
      setMigrationDone(true);
      setMigrationStatus("skipped");
      return;
    }

    try {
      const localData = JSON.parse(raw);
      const hasGoals = localData.goals && localData.goals.length > 0;
      const hasStreak =
        localData.streak && localData.streak.currentStreak > 0;
      const hasActivity =
        localData.activityLog && localData.activityLog.length > 0;

      if (!hasGoals && !hasStreak && !hasActivity) {
        localStorage.setItem(MIGRATED_KEY, "true");
        setMigrationDone(true);
        setMigrationStatus("skipped");
        return;
      }

      // Perform migration
      setMigrationStatus("migrating");
      migrateData(localData)
        .unwrap()
        .then(() => {
          localStorage.setItem(MIGRATED_KEY, "true");
          setMigrationDone(true);
          setMigrationStatus("done");
        })
        .catch((err) => {
          console.error("Migration failed:", err);
          // Still mark as done to avoid blocking the user
          setMigrationDone(true);
          setMigrationStatus("done");
        });
    } catch (err) {
      console.error("Failed to parse localStorage data:", err);
      localStorage.setItem(MIGRATED_KEY, "true");
      setMigrationDone(true);
      setMigrationStatus("skipped");
    }
  }, [clerkLoaded, user, migrationDone, migrateData]);

  // Show overlay only while actively migrating
  if (migrationStatus === "migrating" && isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Migrating Your Data
            </h2>
            <p className="text-gray-600">
              Transferring your goals and progress to the cloud. This only
              happens once.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
