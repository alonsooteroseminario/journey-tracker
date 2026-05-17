"use client";

import { useState } from "react";
import { useUpdateTemplateMutation } from "@/store/slices/templatesSlice";
import type { GoalTemplate, Task, Phase, ResourceCategory } from "@/types";

interface TemplateEditorProps {
  template: GoalTemplate;
}

export function TemplateEditor({ template }: TemplateEditorProps) {
  const [updateTemplate] = useUpdateTemplateMutation();
  const tasks = (template.tasks as unknown as Task[]) || [];
  const phases = (template.phases as unknown as Phase[]) || [];
  const resources = (template.resources as unknown as ResourceCategory[]) || [];

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSubstepId, setEditingSubstepId] = useState<string | null>(null);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDescValue, setEditDescValue] = useState("");

  // Confirmation state
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

  // New resource form
  const [newResourceCategory, setNewResourceCategory] = useState("");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  const mutate = (action: string, payload: Record<string, unknown>) => {
    updateTemplate({ id: template.id, data: { action: action as UpdateAction, payload } });
  };

  type UpdateAction = NonNullable<Parameters<typeof updateTemplate>[0]["data"]["action"]>;

  // --- Task Actions ---
  const handleAddTask = () => {
    mutate("addTask", { title: "New Task" });
  };

  const handleSaveTask = (taskId: string) => {
    mutate("updateTask", { taskId, updates: { title: editValue, description: editDescValue } });
    setEditingTaskId(null);
  };

  const handleRemoveTask = (taskId: string) => {
    mutate("removeTask", { taskId });
    setConfirmDeleteTaskId(null);
  };

  // --- Substep Actions ---
  const handleAddSubstep = (taskId: string) => {
    mutate("addSubstep", { taskId, title: "New Substep" });
  };

  const handleSaveSubstep = (taskId: string, substepId: string) => {
    mutate("updateSubstep", { taskId, substepId, updates: { title: editValue } });
    setEditingSubstepId(null);
  };

  const handleRemoveSubstep = (taskId: string, substepId: string) => {
    mutate("removeSubstep", { taskId, substepId });
  };

  // --- Phase Actions ---
  const handleAddPhase = () => {
    mutate("addPhase", { name: "New Phase" });
  };

  const handleSavePhase = (phaseId: string) => {
    mutate("updatePhase", { phaseId, updates: { name: editValue, description: editDescValue } });
    setEditingPhaseId(null);
  };

  const handleRemovePhase = (phaseId: string) => {
    mutate("removePhase", { phaseId });
  };

  // --- Resource Actions ---
  const handleAddResource = () => {
    if (!newResourceName.trim()) return;
    mutate("addResource", {
      category: newResourceCategory || "General",
      name: newResourceName,
      url: newResourceUrl,
    });
    setNewResourceCategory("");
    setNewResourceName("");
    setNewResourceUrl("");
  };

  const handleRemoveResource = (index: number) => {
    mutate("removeResource", { index });
  };

  return (
    <div className="space-y-6">
      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            Tasks ({tasks.length})
          </h3>
          <button
            onClick={handleAddTask}
            className="px-3 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Add Task
          </button>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="border border-border rounded-lg p-3">
              {editingTaskId === task.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Task title"
                    autoFocus
                  />
                  <textarea
                    value={editDescValue}
                    onChange={(e) => setEditDescValue(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTask(task.id)}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className="px-3 py-1 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setEditValue(task.title);
                      setEditDescValue(task.description || "");
                    }}
                  >
                    <p className="text-sm font-medium text-text-primary">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-text-muted mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAddSubstep(task.id)}
                      className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Add Substep"
                    >
                      + Substep
                    </button>
                    {confirmDeleteTaskId === task.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRemoveTask(task.id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTaskId(null)}
                          className="px-2 py-1 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface-hover"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteTaskId(task.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        title="Delete Task"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Substeps */}
              {task.substeps && task.substeps.length > 0 && (
                <div className="mt-2 ml-4 space-y-1">
                  {task.substeps.map((substep) => (
                    <div key={substep.id} className="flex items-center gap-2 group">
                      <span className="text-xs text-text-muted">-</span>
                      {editingSubstepId === substep.id ? (
                        <div className="flex-1 flex gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-0.5 text-xs border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveSubstep(task.id, substep.id)}
                            className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSubstepId(null)}
                            className="px-2 py-0.5 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface-hover"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="flex-1 text-xs text-text-secondary cursor-pointer hover:text-text-primary"
                            onClick={() => {
                              setEditingSubstepId(substep.id);
                              setEditValue(substep.title);
                            }}
                          >
                            {substep.title}
                          </span>
                          <button
                            onClick={() => handleRemoveSubstep(task.id, substep.id)}
                            className="px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove substep"
                          >
                            x
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {tasks.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No tasks yet. Click &quot;+ Add Task&quot; to get started.
            </p>
          )}
        </div>
      </div>

      {/* Phases Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            Phases ({phases.length})
          </h3>
          <button
            onClick={handleAddPhase}
            className="px-3 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Add Phase
          </button>
        </div>

        <div className="space-y-2">
          {phases.map((phase) => (
            <div key={phase.id} className="border border-border rounded-lg p-3">
              {editingPhaseId === phase.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Phase name"
                    autoFocus
                  />
                  <textarea
                    value={editDescValue}
                    onChange={(e) => setEditDescValue(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSavePhase(phase.id)}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPhaseId(null)}
                      className="px-3 py-1 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      setEditingPhaseId(phase.id);
                      setEditValue(phase.name);
                      setEditDescValue(phase.description || "");
                    }}
                  >
                    <p className="text-sm font-medium text-text-primary">{phase.name}</p>
                    {phase.description && (
                      <p className="text-xs text-text-muted mt-1">{phase.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemovePhase(phase.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {phases.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No phases defined.
            </p>
          )}
        </div>
      </div>

      {/* Resources Section */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-3">
          Resources ({resources.length})
        </h3>

        <div className="space-y-2 mb-3">
          {resources.map((resource, index) => (
            <div key={index} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{resource.category}</p>
                {resource.resources && resource.resources.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {resource.resources.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-text-secondary">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                            {item.name || item.url}
                          </a>
                        ) : (
                          item.name
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => handleRemoveResource(index)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Add Resource Form */}
        <div className="border border-dashed border-border-strong rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-text-secondary">Add Resource</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newResourceCategory}
              onChange={(e) => setNewResourceCategory(e.target.value)}
              className="px-2 py-1 text-xs border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Category"
            />
            <input
              type="text"
              value={newResourceName}
              onChange={(e) => setNewResourceName(e.target.value)}
              className="px-2 py-1 text-xs border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Name"
            />
            <input
              type="text"
              value={newResourceUrl}
              onChange={(e) => setNewResourceUrl(e.target.value)}
              className="px-2 py-1 text-xs border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="URL (optional)"
            />
          </div>
          <button
            onClick={handleAddResource}
            disabled={!newResourceName.trim()}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Resource
          </button>
        </div>
      </div>
    </div>
  );
}
