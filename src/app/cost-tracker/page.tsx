"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Overview } from "./components/Overview";
import { Breakdown } from "./components/Breakdown";
import { Daily } from "./components/Daily";
import { Transactions } from "./components/Transactions";
import { BudgetAlerts } from "./components/BudgetAlerts";
import { TransactionForm } from "./components/TransactionForm";
import { useCostTracker } from "./hooks/useCostTracker";

type Tab = "overview" | "breakdown" | "transactions" | "alerts";

export default function CostTrackerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const {
    overview,
    breakdown,
    daily,
    transactions,
    budget,
    isLoading,
    error,
    addTransaction,
    updateBudget,
    deleteTransaction,
    refreshData,
  } = useCostTracker();

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddTransaction = async (data: any) => {
    try {
      await addTransaction(data);
      setIsFormOpen(false);
      setTimeout(() => refreshData(), 500);
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTimeout(() => refreshData(), 500);
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  if (isLoading && !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your costs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header - Same style as Goals page */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💰</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Cost Tracker</h1>
                  <p className="text-sm text-gray-500">Monitor your spending across all tools</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-green-500/25 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-gray-200 -mx-3 sm:-mx-4 px-3 sm:px-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "breakdown"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              📈 Breakdown
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "transactions"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              📝 Transactions
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "alerts"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              🚨 Alerts
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Overview data={overview} budget={budget} />
            <Daily data={daily} />
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === "breakdown" && (
          <div className="space-y-6">
            <Breakdown data={breakdown} />
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <Transactions 
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <BudgetAlerts budget={budget} />
          </div>
        )}
      </main>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Add Transaction</h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <TransactionForm
                onSubmit={handleAddTransaction}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
