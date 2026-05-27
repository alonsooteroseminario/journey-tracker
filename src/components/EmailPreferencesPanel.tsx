"use client";

import { useState } from "react";
import {
  useGetEmailPreferencesQuery,
  useUpdateEmailPreferencesMutation,
} from "@/store/slices/profileSlice";
import type { NotificationType } from "@/types";

export function EmailPreferencesPanel() {
  const { data: preferences, isLoading } = useGetEmailPreferencesQuery();
  const [updatePreferences] = useUpdateEmailPreferencesMutation();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleToggle = async (field: NotificationType | "enabled", value: boolean) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ [field]: value }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setSaveStatus("idle");
    }
  };

  const handleStreakProtectTimeChange = async (time: string) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ streakProtectTime: time }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update streak protect time:", error);
      setSaveStatus("idle");
    }
  };

  const handleStartTimeChange = async (time: string) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ reminderStartTime: time }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update reminder start time:", error);
      setSaveStatus("idle");
    }
  };

  const handleStopTimeChange = async (time: string) => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ reminderStopTime: time || null }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update reminder stop time:", error);
      setSaveStatus("idle");
    }
  };

  const handleFrequencyChange = async (frequency: "immediate" | "daily" | "weekly") => {
    setSaveStatus("saving");
    try {
      await updatePreferences({ frequency }).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update frequency:", error);
      setSaveStatus("idle");
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="bg-surface rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
        <p className="text-text-muted">Loading preferences...</p>
      </div>
    );
  }

  const notificationGroups = [
    {
      title: "Account",
      items: [
        { key: "welcomeEmail" as const, label: "Welcome email" },
        { key: "profileChanges" as const, label: "Profile changes" },
      ],
    },
    {
      title: "Goals",
      items: [
        { key: "goalCreated" as const, label: "Goal created" },
        { key: "goalDeleted" as const, label: "Goal deleted" },
      ],
    },
    {
      title: "Friends",
      items: [
        { key: "friendInvitation" as const, label: "Friend invitation sent" },
        { key: "friendActivity" as const, label: "Friend needs encouragement" },
      ],
    },
    {
      title: "Streaks",
      items: [
        { key: "streakMilestone" as const, label: "Streak milestones" },
        { key: "streakReminder" as const, label: "Warn me before I lose my streak" },
        { key: "friendStreakReminder" as const, label: "Friend streak alerts" },
      ],
    },
    {
      title: "Templates & Marketplace",
      items: [
        { key: "goalPublished" as const, label: "Template published" },
        { key: "goalShared" as const, label: "Template shared with friends" },
        { key: "goalForked" as const, label: "Someone forked your template" },
      ],
    },
    {
      title: "Digests & Reminders",
      items: [
        { key: "morningDigest" as const, label: "Morning digest (tasks due today + overdue)" },
        { key: "overdueAlert" as const, label: "Overdue task alerts (daily at 9am)" },
        { key: "reminderDigest" as const, label: "Repeat reminders every 2 hours (until tasks are done)" },
      ],
    },
  ];

  return (
    <div className="bg-surface rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Email Notifications</h2>
        {saveStatus === "saved" && (
          <span className="text-sm text-green-600">✓ Saved</span>
        )}
        {saveStatus === "saving" && (
          <span className="text-sm text-text-muted">Saving...</span>
        )}
      </div>

      {/* Master toggle */}
      <div className="mb-6 pb-6 border-b border-border">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-text-primary">Enable email notifications</span>
            <p className="text-sm text-text-muted">
              Receive email updates about your goals and activity
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(e) => handleToggle("enabled", e.target.checked)}
            className="w-5 h-5 text-brand-primary rounded focus:ring-2 focus:ring-brand-primary"
          />
        </label>
      </div>

      {/* Frequency selector */}
      {preferences.enabled && (
        <div className="mb-6 pb-6 border-b border-border">
          <label className="block font-medium text-text-primary mb-3">
            Email frequency
          </label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="immediate"
                checked={preferences.frequency === "immediate"}
                onChange={() => handleFrequencyChange("immediate")}
                className="w-4 h-4 text-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
              <span className="ml-3">
                <span className="block text-sm font-medium text-text-primary">
                  Immediate
                </span>
                <span className="block text-xs text-text-muted">
                  Send emails as events happen
                </span>
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={preferences.frequency === "daily"}
                onChange={() => handleFrequencyChange("daily")}
                className="w-4 h-4 text-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
              <span className="ml-3">
                <span className="block text-sm font-medium text-text-primary">
                  Daily digest
                </span>
                <span className="block text-xs text-text-muted">
                  One email per day with all updates
                </span>
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="weekly"
                checked={preferences.frequency === "weekly"}
                onChange={() => handleFrequencyChange("weekly")}
                className="w-4 h-4 text-brand-primary focus:ring-2 focus:ring-brand-primary"
              />
              <span className="ml-3">
                <span className="block text-sm font-medium text-text-primary">
                  Weekly summary
                </span>
                <span className="block text-xs text-text-muted">
                  One email per week with highlights
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Notification type toggles */}
      {preferences.enabled && (
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-text-secondary mb-3">
                {group.title}
              </h3>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.key}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text-primary">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={(e) => handleToggle(item.key, e.target.checked)}
                        className="w-4 h-4 text-brand-primary rounded focus:ring-2 focus:ring-brand-primary"
                      />
                    </label>
                    {item.key === "streakReminder" && preferences.streakReminder && (
                      <div className="mt-2 flex items-center gap-3">
                        <label className="text-xs text-text-muted whitespace-nowrap">Warn me at</label>
                        <select
                          value={preferences.streakProtectTime ?? "20:00"}
                          onChange={(e) => handleStreakProtectTimeChange(e.target.value)}
                          className="text-xs border border-border-strong rounded-md px-2 py-1 bg-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        >
                          {["15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map((t) => (
                            <option key={t} value={t}>
                              {new Date(`2000-01-01T${t}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-text-muted">if no tasks done yet (your local time)</span>
                      </div>
                    )}
                    {item.key === "reminderDigest" && preferences.reminderDigest && (
                      <>
                        <div className="mt-2 flex items-center gap-3">
                          <label className="text-xs text-text-muted whitespace-nowrap">Start at</label>
                          <select
                            value={preferences.reminderStartTime ?? "09:00"}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            className="text-xs border border-border-strong rounded-md px-2 py-1 bg-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          >
                            {["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map((t) => (
                              <option key={t} value={t}>
                                {new Date(`2000-01-01T${t}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-text-muted">then every 2 hrs (your local time)</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <label className="text-xs text-text-muted whitespace-nowrap">Stop at</label>
                          <select
                            value={preferences.reminderStopTime ?? ""}
                            onChange={(e) => handleStopTimeChange(e.target.value)}
                            className="text-xs border border-border-strong rounded-md px-2 py-1 bg-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          >
                            <option value="">No stop time</option>
                            {["18:00","19:00","20:00","21:00","22:00","23:00"].map((t) => (
                              <option key={t} value={t}>
                                {new Date(`2000-01-01T${t}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-text-muted">quiet until next start</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!preferences.enabled && (
        <p className="text-sm text-text-muted text-center py-8">
          Email notifications are disabled. Enable them to customize your preferences.
        </p>
      )}
    </div>
  );
}
