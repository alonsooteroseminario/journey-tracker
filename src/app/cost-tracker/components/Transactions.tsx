"use client";

import { useState } from "react";
import { TransactionForm } from "./TransactionForm";

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
  onAddTransaction: (data: { amount: number; category: string; description?: string; date?: string }) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  claude: "bg-blue-100 text-blue-800",
  elevenlabs: "bg-purple-100 text-purple-800",
  vercel: "bg-gray-100 text-gray-800",
  railway: "bg-brand-light text-brand-primary",
  mongodb: "bg-brand-light text-brand-primary",
  cloudflare: "bg-orange-100 text-orange-800",
  discord: "bg-indigo-100 text-indigo-800",
  cursor: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

export function Transactions({ transactions, onDelete, onAddTransaction, isLoading }: TransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showChargeForm, setShowChargeForm] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCharge = async (data: { amount: number; category: string; description?: string; date?: string }) => {
    await onAddTransaction(data);
    setShowChargeForm(false);
  };

  return (
    <div className="space-y-4">
      {/* One-Time Charge Card */}
      <div className="bg-white rounded-xl border border-dashed border-brand-primary/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Log a One-Time Charge</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Record an ad-hoc spend — overage, one-off purchase, or anything not auto-synced.
            </p>
          </div>
          <button
            onClick={() => setShowChargeForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Charge
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Transactions {transactions && transactions.length > 0 ? `(${transactions.length})` : ""}
        </h2>

        {(!transactions || transactions.length === 0) ? (
          <p className="text-gray-500 text-sm">No transactions yet. Add your first charge above.</p>
        ) : (
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
                {[...transactions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
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
        )}
      </div>

      {/* Add Charge Modal */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Log One-Time Charge</h2>
              <button
                onClick={() => setShowChargeForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <TransactionForm onSubmit={handleAddCharge} onCancel={() => setShowChargeForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
