"use client";

import { useState } from "react";
import type { ModelMetadata } from "@/lib/admin/modelRegistry";

interface DataTableProps {
  metadata: ModelMetadata;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sortBy: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onRowClick: (record: any) => void;
}

export function DataTable({
  metadata,
  data,
  pagination,
  sortBy,
  order,
  onSort,
  onPageChange,
  onRowClick,
}: DataTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(metadata.displayColumns)
  );

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return "—";

    // Check if it's a JSON field
    if (metadata.jsonFields.includes(field)) {
      if (typeof value === "object") {
        return JSON.stringify(value).substring(0, 50) + "...";
      }
    }

    // Format dates
    if (value instanceof Date || (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
      return new Date(value).toLocaleDateString() + " " + new Date(value).toLocaleTimeString();
    }

    // Format booleans
    if (typeof value === "boolean") {
      return value ? "✓ Yes" : "✗ No";
    }

    // Truncate long strings
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 47) + "...";
    }

    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Column Visibility Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Columns:</span>
        {metadata.displayColumns.map((column) => (
          <button
            key={column}
            onClick={() => toggleColumn(column)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              visibleColumns.has(column)
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {column}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Array.from(visibleColumns).map((column) => {
                  const isSortable = metadata.sortableFields.includes(column);
                  const isActive = sortBy === column;

                  return (
                    <th
                      key={column}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        isSortable ? "cursor-pointer hover:bg-gray-100" : ""
                      }`}
                      onClick={() => isSortable && onSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column}</span>
                        {isSortable && isActive && (
                          <span className="text-blue-600">
                            {order === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.size}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => onRowClick(record)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {Array.from(visibleColumns).map((column) => (
                      <td
                        key={column}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {formatValue(record[column], column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
