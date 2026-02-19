/**
 * Migration script: Add `status` field to all existing tasks and substeps.
 *
 * Maps: completed=true → status='completed', completed=false → status='not_started'
 *
 * Run with: npx tsx src/scripts/migrate-task-status.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTaskStatus() {
  console.log('Starting task status migration...');

  const goals = await prisma.goal.findMany();
  let migratedGoals = 0;
  let migratedTasks = 0;
  let migratedSubsteps = 0;

  for (const goal of goals) {
    const tasks = (goal.tasks as Record<string, unknown>[]) || [];
    let changed = false;

    for (const task of tasks) {
      if (!task.status) {
        task.status = task.completed ? 'completed' : 'not_started';
        if (task.completed && !task.completedAt) {
          task.completedAt = (goal.updatedAt as Date)?.toISOString();
        }
        changed = true;
        migratedTasks++;
      }

      const substeps = (task.substeps as Record<string, unknown>[]) || [];
      for (const substep of substeps) {
        if (!substep.status) {
          substep.status = substep.completed ? 'completed' : 'not_started';
          if (substep.completed && !substep.completedAt) {
            substep.completedAt = (goal.updatedAt as Date)?.toISOString();
          }
          changed = true;
          migratedSubsteps++;
        }
      }
    }

    if (changed) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: { tasks: tasks as Parameters<typeof prisma.goal.update>[0]['data']['tasks'] },
      });
      migratedGoals++;
    }
  }

  console.log(`Migration complete:`);
  console.log(`  Goals updated:    ${migratedGoals}`);
  console.log(`  Tasks migrated:   ${migratedTasks}`);
  console.log(`  Substeps migrated: ${migratedSubsteps}`);
}

migrateTaskStatus()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
