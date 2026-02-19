/**
 * Migration Script: Convert completed boolean to status field
 *
 * This script migrates existing Goal.tasks data from the old schema:
 *   completed: boolean
 *
 * To the new schema:
 *   status: 'not_started' | 'in_progress' | 'completed'
 *
 * Run with: npx tsx scripts/migrate-task-status.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface OldTask {
  id: string;
  title: string;
  completed?: boolean;
  status?: string;
  substeps?: OldSubstep[];
  [key: string]: any;
}

interface OldSubstep {
  id: string;
  title: string;
  completed?: boolean;
  status?: string;
  [key: string]: any;
}

async function migrateTaskStatus() {
  console.log("🚀 Starting task status migration...\n");

  try {
    // Fetch all goals
    const goals = await prisma.goal.findMany({
      select: {
        id: true,
        title: true,
        tasks: true,
      },
    });

    console.log(`📊 Found ${goals.length} goals to process\n`);

    let updatedGoalsCount = 0;
    let updatedTasksCount = 0;
    let updatedSubstepsCount = 0;

    for (const goal of goals) {
      const tasks = goal.tasks as any[];
      let needsUpdate = false;

      const migratedTasks = tasks.map((task: OldTask) => {
        let taskUpdated = false;

        // Migrate task status
        if (typeof task.completed === "boolean" && !task.status) {
          task.status = task.completed ? "completed" : "not_started";
          delete task.completed;
          taskUpdated = true;
          updatedTasksCount++;
        }

        // Migrate substep status
        if (task.substeps && Array.isArray(task.substeps)) {
          task.substeps = task.substeps.map((substep: OldSubstep) => {
            if (typeof substep.completed === "boolean" && !substep.status) {
              substep.status = substep.completed ? "completed" : "not_started";
              delete substep.completed;
              taskUpdated = true;
              updatedSubstepsCount++;
            }
            return substep;
          });
        }

        if (taskUpdated) {
          needsUpdate = true;
        }

        return task;
      });

      // Update goal if any tasks were migrated
      if (needsUpdate) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            tasks: migratedTasks,
            updatedAt: new Date(),
          },
        });
        updatedGoalsCount++;
        console.log(`✅ Migrated goal: ${goal.title} (${goal.id})`);
      }
    }

    console.log("\n🎉 Migration complete!");
    console.log(`📈 Summary:`);
    console.log(`   - Goals updated: ${updatedGoalsCount}`);
    console.log(`   - Tasks migrated: ${updatedTasksCount}`);
    console.log(`   - Substeps migrated: ${updatedSubstepsCount}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateTaskStatus()
  .then(() => {
    console.log("\n✨ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
