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
  vercel: "bg-surface-hover text-text-primary",
  railway: "bg-brand-light text-brand-primary",
  mongodb: "bg-brand-light text-brand-primary",
  cloudflare: "bg-orange-100 text-orange-800",
  discord: "bg-indigo-100 text-indigo-800",
  cursor: "bg-cyan-100 text-cyan-800",
  other: "bg-surface-hover text-text-primary",
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
      <div className="bg-surface rounded-xl border border-dashed border-brand-primary/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Log a One-Time Charge</h3>
            <p className="text-xs text-text-muted mt-0.5">
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
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Transactions {transactions && transactions.length > 0 ? `(${transactions.length})` : ""}
        </h2>

        {(!transactions || transactions.length === 0) ? (
          <p className="text-text-muted text-sm">No transactions yet. Add your first charge above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-secondary">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-secondary">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...transactions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-text-secondary">
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
                      <td className="py-3 px-4 text-text-secondary">{tx.description || "-"}</td>
                      <td className="py-3 px-4 text-right font-semibold text-text-primary">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id || isLoading}
                          className="text-red-500 hover:text-red-700 disabled:text-text-muted transition-colors text-xs font-medium"
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
        <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
              <h2 className="text-xl font-bold text-text-primary">Log One-Time Charge</h2>
              <button
                onClick={() => setShowChargeForm(false)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
