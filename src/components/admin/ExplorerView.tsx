"use client";

import { useState, useEffect } from "react";
import { getAllModelNames, getModelMetadata } from "@/lib/admin/modelRegistry";
import { DataTable } from "./DataTable";
import { SearchFilter } from "./SearchFilter";
import { RecordDetail } from "./RecordDetail";

export function ExplorerView() {
  const modelNames = getAllModelNames();
  const [selectedModel, setSelectedModel] = useState(modelNames[0]);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const metadata = getModelMetadata(selectedModel)!;

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [selectedModel, pagination.page, search, sortBy, order]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        sort: sortBy,
        order,
      });

      const response = await fetch(`/api/admin/explorer/${selectedModel}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setPagination({ ...pagination, page: 1 });
    setSearch("");
    setSortBy("createdAt");
    setOrder("desc");
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setOrder("desc");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleUpdate = async (id: string, updates: any) => {
    const response = await fetch(`/api/admin/explorer/${selectedModel}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update record");
    }

    // Refresh data
    await fetchData();
    setSelectedRecord(null);
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/admin/explorer/${selectedModel}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete record");
    }

    // Refresh data
    await fetchData();
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Database Explorer</h1>
        <p className="text-gray-600 mt-2">
          Browse, search, and manage database records
        </p>
      </div>

      {/* Model Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {modelNames.map((modelName) => {
            const meta = getModelMetadata(modelName)!;
            const isActive = selectedModel === modelName;

            return (
              <button
                key={modelName}
                onClick={() => handleModelChange(modelName)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder={`Search ${metadata.label.toLowerCase()}...`}
          />
        </div>
        <div className="text-sm text-gray-600">
          {pagination.total} {metadata.label.toLowerCase()} found
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading {metadata.label.toLowerCase()}...</p>
          </div>
        </div>
      ) : (
        <DataTable
          metadata={metadata}
          data={data}
          pagination={pagination}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onRowClick={setSelectedRecord}
        />
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordDetail
          metadata={metadata}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
