"use client";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kanban Board</h1>
          <p className="text-gray-600">Drag and drop to update task status</p>
        </div>
        <KanbanBoard />
      </div>
    </div>
  );
}
