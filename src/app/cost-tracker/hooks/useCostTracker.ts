"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

interface OverviewData {
  total: number;
  month: string;
  percentUsed: number;
  budget: number;
}

interface BreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface DailyData {
  date: string;
  total: number;
  breakdown: Record<string, number>;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  source: string;
  createdAt: string;
}

interface BudgetData {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
  spentSoFar: number;
  percentUsed: number;
  alerts: string[];
}

export interface CredentialItem {
  id: string;
  provider: string;
  label: string;
  keyType: string | null;
  maskedKey: string;
  lastSyncedAt: string | null;
}

export function useCostTracker() {
  const { isLoaded, isSignedIn } = useUser();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[] | null>(null);
  const [daily, setDaily] = useState<DailyData[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, breakdownRes, dailyRes, transactionsRes, budgetRes, credentialsRes] =
        await Promise.all([
          fetch("/api/cost-tracker/overview"),
          fetch("/api/cost-tracker/breakdown"),
          fetch("/api/cost-tracker/daily"),
          fetch("/api/cost-tracker/transactions"),
          fetch("/api/cost-tracker/budget"),
          fetch("/api/cost-tracker/credentials"),
        ]);

      if (!overviewRes.ok) throw new Error("Failed to fetch overview");
      if (!breakdownRes.ok) throw new Error("Failed to fetch breakdown");
      if (!dailyRes.ok) throw new Error("Failed to fetch daily data");
      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
      if (!budgetRes.ok) throw new Error("Failed to fetch budget");
      if (!credentialsRes.ok) throw new Error("Failed to fetch credentials");

      const [overviewData, breakdownData, dailyData, transactionsData, budgetData, credentialsData] =
        await Promise.all([
          overviewRes.json(),
          breakdownRes.json(),
          dailyRes.json(),
          transactionsRes.json(),
          budgetRes.json(),
          credentialsRes.json(),
        ]);

      setOverview(overviewData);
      setBreakdown(breakdownData);
      setDaily(dailyData);
      setTransactions(transactionsData);
      setBudget(budgetData);
      setCredentials(credentialsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load cost tracker data";
      setError(message);
      console.error("Cost Tracker Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const addTransaction = useCallback(
    async (data: { amount: number; category: string; description?: string; date?: string }) => {
      const response = await fetch("/api/cost-tracker/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add transaction");
      return await response.json();
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const response = await fetch(`/api/cost-tracker/transactions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
    return await response.json();
  }, []);

  const updateBudget = useCallback(
    async (data: { monthlyLimit: number; categoryLimits?: Record<string, number> }) => {
      const response = await fetch("/api/cost-tracker/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update budget");
      return await response.json();
    },
    []
  );

  const addCredential = useCallback(async (provider: string, apiKey: string, label: string) => {
    const response = await fetch("/api/cost-tracker/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, label }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Failed to save credential");
    }
    return await response.json();
  }, []);

  const deleteCredential = useCallback(async (id: string) => {
    const response = await fetch(`/api/cost-tracker/credentials/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete credential");
    return await response.json();
  }, []);

  const syncProvider = useCallback(async (provider: string, credentialId: string) => {
    const response = await fetch(`/api/cost-tracker/sync/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Sync failed");
    }
    return await response.json();
  }, []);

  const validateCredential = useCallback(async (provider: string, credentialId: string) => {
    const response = await fetch(`/api/cost-tracker/validate/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || "Validation failed");
    }
    return data as { valid: boolean; keyType: string };
  }, []);

  const updateCredential = useCallback(async (id: string, data: { label?: string; apiKey?: string }) => {
    const response = await fetch(`/api/cost-tracker/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error((json as { error?: string }).error || "Failed to update credential");
    }
    return await response.json() as CredentialItem;
  }, []);

  return {
    overview,
    breakdown,
    daily,
    transactions,
    budget,
    credentials,
    isLoading,
    error,
    refreshData,
    addTransaction,
    deleteTransaction,
    updateBudget,
    addCredential,
    deleteCredential,
    updateCredential,
    syncProvider,
    validateCredential,
  };
}
