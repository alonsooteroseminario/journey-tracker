"use client";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <KanbanBoard />
      </div>
    </main>
  );
}
