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
      <div className="bg-gray-100 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-2xl flex-shrink-0">🔕</span>
        <div className="flex-1">
          <p className="text-[10px] sm:text-sm text-gray-600">
            Notifications are not supported in this browser.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-2xl flex-shrink-0">⚠️</span>
        <div className="flex-1">
          <p className="text-[10px] sm:text-sm text-yellow-800">
            Notifications blocked. Enable in browser settings for streak reminders.
          </p>
        </div>
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1">
          <p className="font-medium text-green-800 text-xs sm:text-base">Reminders Active</p>
          <p className="text-[10px] sm:text-sm text-green-600">
            You&apos;ll be reminded at 6 PM if you haven&apos;t completed a task.
          </p>
        </div>
        <button
          onClick={onDisable}
          className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-green-700 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
        >
          Disable
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-light border border-brand-light rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
      <span className="text-base sm:text-2xl flex-shrink-0">🔔</span>
      <div className="flex-1">
        <p className="font-medium text-brand-primary text-xs sm:text-base">Enable Reminders</p>
        <p className="text-[10px] sm:text-sm text-brand-primary">
          Get notified to keep your streak alive!
        </p>
      </div>
      <button
        onClick={onEnable}
        className="px-2 sm:px-4 py-1.5 sm:py-2 bg-brand-primary text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-brand-secondary transition-colors flex-shrink-0"
      >
        Enable
      </button>
    </div>
  );
}
