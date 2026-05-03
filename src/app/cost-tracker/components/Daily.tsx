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
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Spending</h2>
        <p className="text-gray-500">No spending data yet.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Daily Spending Trend</h2>

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
                <span className="text-sm font-medium text-gray-700">{dayLabel}</span>
                <span className="text-sm font-semibold text-gray-800">${item.total.toFixed(2)}</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all"
                  style={{ width: `${(item.total / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 mt-6 pt-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total (7d)</p>
            <p className="text-lg font-bold text-gray-800">
              ${data.reduce((sum, d) => sum + d.total, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Average</p>
            <p className="text-lg font-bold text-gray-800">
              ${(data.reduce((sum, d) => sum + d.total, 0) / data.length).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Highest Day</p>
            <p className="text-lg font-bold text-gray-800">
              ${Math.max(...data.map((d) => d.total)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
