"use client";

import { useState } from "react";

interface BudgetData {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
  spentSoFar: number;
  percentUsed: number;
  alerts: string[];
}

interface BudgetAlertsProps {
  budget: BudgetData | null;
  onUpdateBudget: (data: { monthlyLimit: number }) => Promise<void>;
}

export function BudgetAlerts({ budget, onUpdateBudget }: BudgetAlertsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [limitInput, setLimitInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(limitInput);
    if (isNaN(val) || val < 0) {
      setSaveError("Enter a valid amount (0 or more).");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateBudget({ monthlyLimit: val });
      setIsEditing(false);
      setLimitInput("");
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (!budget) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border">
        <p className="text-text-muted">Loading budget data...</p>
      </div>
    );
  }

  const getAlertColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "bg-red-50 border-red-200";
    if (percentUsed >= 75) return "bg-yellow-50 border-yellow-200";
    return "bg-brand-light border-brand-primary/10";
  };

  const getAlertIcon = (percentUsed: number) => {
    if (percentUsed >= 90) return "🔴";
    if (percentUsed >= 75) return "🟡";
    return "🟢";
  };

  return (
    <div className="space-y-4">
      {/* Budget Settings Card */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Monthly Budget</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Current limit:{" "}
              <span className="font-medium text-text-secondary">${budget.monthlyLimit.toFixed(2)}</span>
              {savedMsg && <span className="ml-2 text-green-600 font-medium">Saved!</span>}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => { setLimitInput(String(budget.monthlyLimit)); setIsEditing(true); setSaveError(null); }}
              className="px-3 py-1.5 text-xs font-medium bg-surface-hover text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
            >
              Edit Limit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-24 px-2 py-1.5 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setSaveError(null); }}
                className="px-3 py-1.5 text-xs font-medium bg-surface-hover text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {saveError && <p className="text-xs text-red-500 mt-2">{saveError}</p>}
      </div>

      {/* Budget Status Card */}
      <div className={`rounded-xl p-6 border ${getAlertColor(budget.percentUsed)}`}>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{getAlertIcon(budget.percentUsed)}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary">Budget Status</h2>
              <p className="text-text-secondary mt-1">
                You've spent <span className="font-semibold">${budget.spentSoFar.toFixed(2)} CAD</span> of your{" "}
                <span className="font-semibold">${budget.monthlyLimit.toFixed(2)} CAD</span> monthly budget
              </p>
            </div>
          </div>

          <div className="bg-surface/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-3">
            {budget.percentUsed >= 90 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800">Critical Alert</p>
                  <p className="text-sm text-red-700">
                    You've used {budget.percentUsed}% of your monthly budget. Only ${(budget.monthlyLimit - budget.spentSoFar).toFixed(2)} CAD remaining.
                  </p>
                </div>
              </div>
            )}

            {budget.percentUsed >= 75 && budget.percentUsed < 90 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Budget Warning</p>
                  <p className="text-sm text-yellow-700">
                    You've used {budget.percentUsed}% of your monthly budget. Consider reducing spending.
                  </p>
                </div>
              </div>
            )}

            {budget.percentUsed < 75 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-semibold text-brand-primary">On Track</p>
                  <p className="text-sm text-brand-primary/80">
                    You've used {budget.percentUsed}% of your monthly budget. Great job staying within limits!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Overall Budget Usage</span>
              <span>{budget.percentUsed}%</span>
            </div>
            <div className="w-full bg-surface-hover rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budget.percentUsed >= 90
                    ? "bg-red-500"
                    : budget.percentUsed >= 75
                    ? "bg-yellow-500"
                    : "bg-brand-primary"
                }`}
                style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {budget.alerts.length > 0 && (
            <div className="bg-surface/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-2">
              <p className="font-semibold text-text-primary">Active Notifications</p>
              <ul className="space-y-2">
                {budget.alerts.map((alert, idx) => (
                  <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                    <span>📌</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
