"use client";

import { useState } from "react";
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from "@/store/slices/groupsSlice";

const PRESET_COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

interface GoalGroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalGroupManager({ isOpen, onClose }: GoalGroupManagerProps) {
  const { data: groups = [] } = useGetGroupsQuery();
  const [createGroup] = useCreateGroupMutation();
  const [updateGroup] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createGroup({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateGroup({ id: editingId, updates: { name: editName.trim(), color: editColor } });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteGroup(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Manage Groups</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {groups.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No groups yet. Create one below.</p>
          )}
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              {editingId === group.id ? (
                <>
                  <div className="flex gap-1 flex-shrink-0">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${
                          editColor === c ? "border-gray-800" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Save"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="flex-1 text-sm text-gray-800 truncate">{group.name}</span>
                  <button
                    onClick={() => handleStartEdit(group.id, group.name, group.color)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Edit group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {deleteConfirmId === group.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(group.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete group"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new group */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex gap-1.5 justify-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  newColor === c ? "border-gray-800 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New group name..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
