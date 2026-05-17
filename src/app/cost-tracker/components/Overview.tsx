"use client";

import { useMemo } from "react";

interface OverviewData {
  total: number;
  month: string;
  percentUsed: number;
  budget: number;
}

interface BudgetData {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
  spentSoFar: number;
  percentUsed: number;
  alerts: string[];
}

interface OverviewProps {
  data: OverviewData | null;
  budget: BudgetData | null;
}

export function Overview({ data, budget }: OverviewProps) {
  const remaining = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.budget - data.total);
  }, [data]);

  const status = useMemo(() => {
    if (!data) return "loading";
    if (data.percentUsed >= 90) return "danger";
    if (data.percentUsed >= 75) return "warning";
    return "healthy";
  }, [data]);

  const statusColor = {
    loading: "bg-surface border-border",
    danger: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    healthy: "bg-brand-light border-brand-primary/10",
  };

  const statusBadge = {
    loading: "bg-surface-hover text-text-secondary",
    danger: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    healthy: "bg-brand-light text-brand-primary",
  };

  if (!data || !budget) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border">
        <p className="text-text-muted">Loading budget data...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border ${statusColor[status]} transition-all`}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {data.month} Spending Summary
            </h2>
            <p className="text-sm text-text-secondary">
              Monthly budget: <span className="font-semibold">${data.budget.toFixed(2)} CAD</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[status]}`}>
            {data.percentUsed}% Used
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-4 border border-white">
            <p className="text-xs text-text-secondary mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-text-primary">${data.total.toFixed(2)}</p>
            <p className="text-xs text-text-muted mt-1">of ${data.budget.toFixed(2)}</p>
          </div>

          <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-4 border border-white">
            <p className="text-xs text-text-secondary mb-1">Remaining</p>
            <p className="text-2xl font-bold text-brand-primary">${remaining.toFixed(2)}</p>
            <p className="text-xs text-text-muted mt-1">Left this month</p>
          </div>

          <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-4 border border-white col-span-2 md:col-span-1">
            <p className="text-xs text-text-secondary mb-1">Budget Used</p>
            <p className="text-2xl font-bold text-text-primary">{data.percentUsed}%</p>
            <p className="text-xs text-text-muted mt-1">of monthly limit</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Progress</span>
            <span>{data.total.toFixed(2)} / {data.budget.toFixed(2)}</span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status === "danger"
                  ? "bg-red-500"
                  : status === "warning"
                  ? "bg-yellow-500"
                  : "bg-brand-primary"
              }`}
              style={{ width: `${Math.min(data.percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {budget.alerts.length > 0 && (
          <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-4 border border-white space-y-2">
            <p className="font-semibold text-sm text-text-primary">Alerts</p>
            <ul className="space-y-1">
              {budget.alerts.map((alert, idx) => (
                <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
