"use client";

interface BudgetData {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
  spentSoFar: number;
  percentUsed: number;
  alerts: string[];
}

interface BudgetAlertsProps {
  budget: BudgetData | null;
}

export function BudgetAlerts({ budget }: BudgetAlertsProps) {
  if (!budget) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <p className="text-gray-500">Loading budget data...</p>
      </div>
    );
  }

  const getAlertColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "bg-red-50 border-red-200";
    if (percentUsed >= 75) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getAlertIcon = (percentUsed: number) => {
    if (percentUsed >= 90) return "🔴";
    if (percentUsed >= 75) return "🟡";
    return "🟢";
  };

  return (
    <div className={`rounded-xl p-6 border ${getAlertColor(budget.percentUsed)}`}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{getAlertIcon(budget.percentUsed)}</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">Budget Status</h2>
            <p className="text-gray-600 mt-1">
              You've spent <span className="font-semibold">${budget.spentSoFar.toFixed(2)} CAD</span> of your{" "}
              <span className="font-semibold">${budget.monthlyLimit.toFixed(2)} CAD</span> monthly budget
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-3">
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
                <p className="font-semibold text-green-800">On Track</p>
                <p className="text-sm text-green-700">
                  You've used {budget.percentUsed}% of your monthly budget. Great job staying within limits!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Overall Budget Usage</span>
            <span>{budget.percentUsed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                budget.percentUsed >= 90
                  ? "bg-red-500"
                  : budget.percentUsed >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {budget.alerts.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-2">
            <p className="font-semibold text-gray-800">Active Notifications</p>
            <ul className="space-y-2">
              {budget.alerts.map((alert, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span>📌</span>
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
