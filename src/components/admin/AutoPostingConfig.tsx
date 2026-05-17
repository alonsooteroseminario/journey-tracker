"use client";

import { useState } from "react";
import { useUpdateCampaignMutation } from "@/store/slices/adminSlice";

interface AutoPostingConfigProps {
  campaignId: string;
  currentSchedule?: any;
}

export function AutoPostingConfig({
  campaignId,
  currentSchedule,
}: AutoPostingConfigProps) {
  const [updateCampaign] = useUpdateCampaignMutation();
  const [schedule, setSchedule] = useState({
    frequency: currentSchedule?.frequency || "daily",
    times: currentSchedule?.times || ["09:00"],
    daysOfWeek: currentSchedule?.daysOfWeek || [1, 2, 3, 4, 5], // Mon-Fri
    timezone: currentSchedule?.timezone || "America/New_York",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCampaign({
        id: campaignId,
        postingSchedule: schedule,
      }).unwrap();
      alert("Posting schedule saved!");
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const addTime = () => {
    setSchedule((prev) => ({
      ...prev,
      times: [...prev.times, "12:00"],
    }));
  };

  const removeTime = (index: number) => {
    setSchedule((prev) => ({
      ...prev,
      times: prev.times.filter((_time: string, i: number) => i !== index),
    }));
  };

  const updateTime = (index: number, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      times: prev.times.map((t: string, i: number) => (i === index ? value : t)),
    }));
  };

  const toggleDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d: number) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-surface border rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Automated Posting Schedule</h3>
        <p className="text-sm text-text-secondary">
          Configure when posts should be automatically published for this campaign
        </p>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium mb-2">Frequency</label>
        <select
          value={schedule.frequency}
          onChange={(e) =>
            setSchedule({ ...schedule, frequency: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Days of Week */}
      <div>
        <label className="block text-sm font-medium mb-2">Days of Week</label>
        <div className="flex gap-2">
          {dayNames.map((name, index) => (
            <button
              key={index}
              onClick={() => toggleDay(index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                schedule.daysOfWeek.includes(index)
                  ? "bg-brand-primary text-white"
                  : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Times */}
      <div>
        <label className="block text-sm font-medium mb-2">Posting Times</label>
        <div className="space-y-2">
          {schedule.times.map((time: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
              />
              {schedule.times.length > 1 && (
                <button
                  onClick={() => removeTime(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTime}
            className="text-sm text-brand-primary hover:text-brand-secondary"
          >
            + Add another time
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium mb-2">Timezone</label>
        <select
          value={schedule.timezone}
          onChange={(e) =>
            setSchedule({ ...schedule, timezone: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="UTC">UTC</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
        </select>
      </div>

      {/* Preview */}
      <div className="bg-brand-light border border-brand-light rounded-lg p-4">
        <div className="text-sm font-medium text-brand-primary mb-2">
          Schedule Preview
        </div>
        <div className="text-sm text-brand-primary">
          Posts will be published on{" "}
          {schedule.daysOfWeek.map((d: number) => dayNames[d]).join(", ")} at{" "}
          {schedule.times.join(", ")} ({schedule.timezone})
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? "Saving..." : "Save Schedule"}
      </button>
    </div>
  );
}
