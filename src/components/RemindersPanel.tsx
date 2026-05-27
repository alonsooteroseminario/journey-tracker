"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useGetGoalsQuery } from "@/store/slices/goalsSlice";
import type { Goal, Task, Substep } from "@/types";

interface ReminderItem {
  id: string;
  title: string;
  goalTitle: string;
  type: "task" | "substep";
}

export function RemindersPanel() {
  const { data: goals = [] } = useGetGoalsQuery();

  const reminderItems = useMemo<ReminderItem[]>(() => {
    const items: ReminderItem[] = [];
    for (const goal of goals as Goal[]) {
      const tasks = (goal.tasks as Task[] | null) ?? [];
      for (const task of tasks) {
        if (task.isArchived || task.status === "completed") continue;
        if (task.reminderEnabled) {
          items.push({ id: task.id, title: task.title, goalTitle: goal.title, type: "task" });
        }
        for (const substep of (task.substeps as Substep[] | null) ?? []) {
          if (substep.isArchived || substep.status === "completed") continue;
          if (substep.reminderEnabled) {
            items.push({ id: substep.id, title: substep.title, goalTitle: goal.title, type: "substep" });
          }
        }
      }
    }
    return items;
  }, [goals]);

  if (reminderItems.length === 0) return null;

  // Group by goalTitle
  const grouped = reminderItems.reduce<Record<string, ReminderItem[]>>((acc, item) => {
    if (!acc[item.goalTitle]) acc[item.goalTitle] = [];
    acc[item.goalTitle].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-surface rounded-lg p-4 sm:p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🔔 Reminders ({reminderItems.length})
        </h3>
        <Link href="/board" className="text-xs text-brand-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {Object.entries(grouped).map(([goalTitle, items]) => (
          <div key={goalTitle}>
            <p className="text-xs font-medium text-text-muted mb-1">{goalTitle}</p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="text-brand-primary">🔔</span>
                  <span className="truncate">{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
