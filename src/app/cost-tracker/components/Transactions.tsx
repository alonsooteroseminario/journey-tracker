"use client";

import { useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  source: string;
  createdAt: string;
}

interface TransactionsProps {
  transactions: Transaction[] | null;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  claude: "bg-blue-100 text-blue-800",
  elevenlabs: "bg-purple-100 text-purple-800",
  vercel: "bg-gray-100 text-gray-800",
  railway: "bg-green-100 text-green-800",
  mongodb: "bg-green-100 text-green-800",
  cloudflare: "bg-orange-100 text-orange-800",
  discord: "bg-indigo-100 text-indigo-800",
  cursor: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

export function Transactions({ transactions, onDelete, isLoading }: TransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transactions</h2>
        <p className="text-gray-500">No transactions yet. Add your first transaction to get started.</p>
      </div>
    );
  }

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Transactions ({transactions.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="text-gray-600">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other}`}>
                    {tx.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">{tx.description || "-"}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-800">
                  ${tx.amount.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id || isLoading}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors text-xs font-medium"
                  >
                    {deletingId === tx.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
