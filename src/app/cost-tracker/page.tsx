"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useGoals } from "@/hooks/useGoals";
import { Overview } from "./components/Overview";
import { Breakdown } from "./components/Breakdown";
import { Daily } from "./components/Daily";
import { Transactions } from "./components/Transactions";
import { BudgetAlerts } from "./components/BudgetAlerts";
import { Credentials } from "./components/Credentials";
import { TransactionForm } from "./components/TransactionForm";
import { useCostTracker } from "./hooks/useCostTracker";

type Tab = "overview" | "breakdown" | "transactions" | "alerts" | "credentials";

export default function CostTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { streak, getTotalProgress } = useGoals();

  const {
    overview,
    breakdown,
    daily,
    transactions,
    budget,
    credentials,
    isLoading,
    error,
    addTransaction,
    updateBudget,
    deleteTransaction,
    addCredential,
    deleteCredential,
    updateCredential,
    syncProvider,
    validateCredential,
    refreshData,
  } = useCostTracker();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleAddTransaction = async (data: { amount: number; category: string; description?: string; date?: string }) => {
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

  const totalProgress = getTotalProgress();

  if (isLoading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          totalProgress={totalProgress}
          currentStreak={streak.currentStreak}
          onNewGoalClick={() => {}}
        />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your costs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalProgress={totalProgress}
        currentStreak={streak.currentStreak}
        onNewGoalClick={() => {}}
      />
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">💰</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Cost Tracker</h1>
              <p className="text-sm text-gray-500">Monitor your spending across all tools</p>
            </div>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "breakdown"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📈 Breakdown
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "transactions"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Transactions
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "alerts"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            🚨 Alerts
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "credentials"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            🔑 Credentials
          </button>
        </div>
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
            {credentials.some((c) => c.lastSyncedAt) && (
              <div className="flex flex-wrap gap-2">
                {credentials
                  .filter((c) => c.lastSyncedAt)
                  .map((c) => {
                    const diff = Date.now() - new Date(c.lastSyncedAt!).getTime();
                    const mins = Math.floor(diff / 60000);
                    const timeLabel =
                      mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
                    return (
                      <span key={c.id} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                        {c.provider} · {c.label} synced {timeLabel}
                      </span>
                    );
                  })}
              </div>
            )}
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
              onAddTransaction={handleAddTransaction}
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

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <div className="space-y-6">
            <Credentials
              credentials={credentials}
              onAdd={async (provider, apiKey, label) => {
                await addCredential(provider, apiKey, label);
                await refreshData();
              }}
              onDelete={async (id) => {
                await deleteCredential(id);
                await refreshData();
              }}
              onSync={async (provider, credentialId) => {
                const result = await syncProvider(provider, credentialId);
                await refreshData();
                return result;
              }}
              onValidate={async (provider, credentialId) => {
                const result = await validateCredential(provider, credentialId);
                await refreshData();
                return result;
              }}
              onEdit={async (id, data) => {
                await updateCredential(id, data);
                await refreshData();
              }}
            />
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
