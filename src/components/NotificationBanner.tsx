"use client";

interface NotificationBannerProps {
  enabled: boolean;
  isSupported: boolean;
  permission: NotificationPermission | "denied";
  onEnable: () => void;
  onDisable: () => void;
}

export function NotificationBanner({
  enabled,
  isSupported,
  permission,
  onEnable,
  onDisable,
}: NotificationBannerProps) {
  if (!isSupported) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🔕</span>
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Notifications are not supported in this browser.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            Notifications are blocked. Please enable them in your browser settings
            to receive streak reminders.
          </p>
        </div>
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <p className="font-medium text-green-800">Daily Reminders Active</p>
          <p className="text-sm text-green-600">
            You&apos;ll be reminded at 6 PM if you haven&apos;t completed a task.
          </p>
        </div>
        <button
          onClick={onDisable}
          className="px-4 py-2 text-sm text-green-700 hover:bg-green-100 rounded-lg transition-colors"
        >
          Disable
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="font-medium text-blue-800">Enable Daily Reminders</p>
        <p className="text-sm text-blue-600">
          Get notified to keep your streak alive!
        </p>
      </div>
      <button
        onClick={onEnable}
        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
      >
        Enable
      </button>
    </div>
  );
}
