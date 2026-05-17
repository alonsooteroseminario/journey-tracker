"use client";

interface DailyData {
  date: string;
  total: number;
  breakdown: Record<string, number>;
}

interface DailyProps {
  data: DailyData[] | null;
}

export function Daily({ data }: DailyProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Daily Spending</h2>
        <p className="text-text-muted">No spending data yet.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Daily Spending Trend</h2>

      <div className="space-y-4">
        {data.map((item) => {
          const date = new Date(item.date);
          const dayLabel = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div key={item.date} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">{dayLabel}</span>
                <span className="text-sm font-semibold text-text-primary">${item.total.toFixed(2)}</span>
              </div>

              <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all"
                  style={{ width: `${(item.total / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border mt-6 pt-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-secondary">Total (7d)</p>
            <p className="text-lg font-bold text-text-primary">
              ${data.reduce((sum, d) => sum + d.total, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Average</p>
            <p className="text-lg font-bold text-text-primary">
              ${(data.reduce((sum, d) => sum + d.total, 0) / data.length).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Highest Day</p>
            <p className="text-lg font-bold text-text-primary">
              ${Math.max(...data.map((d) => d.total)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
