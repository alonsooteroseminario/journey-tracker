"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export function useCostTracker() {
  const { user, isLoaded } = useUser();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[] | null>(null);
  const [daily, setDaily] = useState<DailyData[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const refreshData = useCallback(async () => {
    if (!userId || !isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      };

      const [overviewRes, breakdownRes, dailyRes, transactionsRes, budgetRes] = await Promise.all([
        fetch(`${API_URL}/api/cost-tracker/overview`, { headers }),
        fetch(`${API_URL}/api/cost-tracker/breakdown`, { headers }),
        fetch(`${API_URL}/api/cost-tracker/daily`, { headers }),
        fetch(`${API_URL}/api/cost-tracker/transactions`, { headers }),
        fetch(`${API_URL}/api/cost-tracker/budget`, { headers }),
      ]);

      if (!overviewRes.ok) throw new Error("Failed to fetch overview");
      if (!breakdownRes.ok) throw new Error("Failed to fetch breakdown");
      if (!dailyRes.ok) throw new Error("Failed to fetch daily data");
      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
      if (!budgetRes.ok) throw new Error("Failed to fetch budget");

      const [overviewData, breakdownData, dailyData, transactionsData, budgetData] = await Promise.all([
        overviewRes.json(),
        breakdownRes.json(),
        dailyRes.json(),
        transactionsRes.json(),
        budgetRes.json(),
      ]);

      setOverview(overviewData);
      setBreakdown(breakdownData);
      setDaily(dailyData);
      setTransactions(transactionsData.data || transactionsData);
      setBudget(budgetData);
    } catch (err: any) {
      setError(err.message || "Failed to load cost tracker data");
      console.error("Cost Tracker Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoaded]);

  const addTransaction = useCallback(
    async (data: {
      amount: number;
      category: string;
      description?: string;
      date?: string;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const response = await fetch(`${API_URL}/api/cost-tracker/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userId,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to add transaction");
        return await response.json();
      } catch (err: any) {
        setError(err.message || "Failed to add transaction");
        throw err;
      }
    },
    [userId]
  );

  const deleteTransaction = useCallback(async (id: string) => {
    if (!userId) throw new Error("User not authenticated");

    try {
      const response = await fetch(`${API_URL}/api/cost-tracker/transactions/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-ID": userId,
        },
      });

      if (!response.ok) throw new Error("Failed to delete transaction");
      return await response.json();
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
      throw err;
    }
  }, [userId]);

  const updateBudget = useCallback(
    async (data: {
      monthlyLimit: number;
      categoryLimits?: Record<string, number>;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const response = await fetch(`${API_URL}/api/cost-tracker/budget`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userId,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update budget");
        return await response.json();
      } catch (err: any) {
        setError(err.message || "Failed to update budget");
        throw err;
      }
    },
    [userId]
  );

  return {
    overview,
    breakdown,
    daily,
    transactions,
    budget,
    isLoading,
    error,
    refreshData,
    addTransaction,
    deleteTransaction,
    updateBudget,
  };
}
