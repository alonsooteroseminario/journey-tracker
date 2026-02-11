"use client";

import { useState } from "react";
import type { ModelMetadata } from "@/lib/admin/modelRegistry";

interface RecordDetailProps {
  metadata: ModelMetadata;
  record: any;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RecordDetail({
  metadata,
  record,
  onClose,
  onUpdate,
  onDelete,
}: RecordDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(record.id, editedData);
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      console.error("Failed to update record:", error);
      alert("Failed to update record. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(record.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return "null";

    // JSON fields
    if (metadata.jsonFields.includes(field)) {
      return JSON.stringify(value, null, 2);
    }

    // Dates
    if (value instanceof Date || (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
      return new Date(value).toISOString();
    }

    // Booleans
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {metadata.label} Record
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {Object.entries(record).map(([key, value]) => (
              <div key={key} className="border-b border-gray-100 pb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key}
                </label>
                {isEditing && key !== "id" && key !== "createdAt" && key !== "updatedAt" ? (
                  metadata.jsonFields.includes(key) ? (
                    <textarea
                      value={editedData[key] !== undefined ? JSON.stringify(editedData[key], null, 2) : formatValue(value, key)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditedData({ ...editedData, [key]: parsed });
                        } catch {
                          // Invalid JSON, store as string
                          setEditedData({ ...editedData, [key]: e.target.value });
                        }
                      }}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  ) : typeof value === "boolean" ? (
                    <select
                      value={editedData[key] !== undefined ? String(editedData[key]) : String(value)}
                      onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value === "true" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editedData[key] !== undefined ? editedData[key] : formatValue(value, key)}
                      onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )
                ) : (
                  <div className={`text-sm ${metadata.jsonFields.includes(key) ? "font-mono bg-gray-50 p-3 rounded" : "text-gray-900"}`}>
                    <pre className="whitespace-pre-wrap break-words">
                      {formatValue(value, key)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {!isEditing && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData({});
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Record?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
