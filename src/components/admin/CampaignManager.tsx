"use client";

import { useState } from "react";
import {
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
} from "@/store/slices/adminSlice";
import type { MarketingCampaign } from "@/types/admin";

export function CampaignManager() {
  const { data, isLoading, error } = useGetCampaignsQuery();
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platforms: [] as string[],
    status: "draft" as const,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.platforms.length === 0) return;

    try {
      await createCampaign({
        name: formData.name,
        description: formData.description || undefined,
        platforms: formData.platforms,
      }).unwrap();

      setFormData({ name: "", description: "", platforms: [], status: "draft" });
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create campaign:", err);
    }
  };

  const handleUpdate = async (campaignId: string, updates: Partial<MarketingCampaign>) => {
    try {
      // Filter out undefined/null values and only send fields that are in the mutation type
      const cleanUpdates: Record<string, any> = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.description !== undefined && updates.description !== null) {
        cleanUpdates.description = updates.description;
      }
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.targetGoals !== undefined) cleanUpdates.targetGoals = updates.targetGoals;
      if (updates.platforms !== undefined) cleanUpdates.platforms = updates.platforms;
      if (updates.postingSchedule !== undefined) cleanUpdates.postingSchedule = updates.postingSchedule;
      if (updates.startDate !== undefined) {
        cleanUpdates.startDate = updates.startDate ? updates.startDate.toISOString() : undefined;
      }
      if (updates.endDate !== undefined) {
        cleanUpdates.endDate = updates.endDate ? updates.endDate.toISOString() : undefined;
      }

      await updateCampaign({
        id: campaignId,
        ...cleanUpdates,
      }).unwrap();
      setEditingCampaign(null);
    } catch (err) {
      console.error("Failed to update campaign:", err);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await deleteCampaign(campaignId).unwrap();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load campaigns</p>
      </div>
    );
  }

  const campaigns = data?.campaigns || [];

  return (
    <div className="space-y-6">
      {/* Create Campaign Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
        >
          + New Campaign
        </button>
      )}

      {/* Create Campaign Form */}
      {isCreating && (
        <div className="bg-surface border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
                placeholder="Q1 Goal Progress Campaign"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary"
                placeholder="Weekly updates on user goal progress..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platforms</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes("twitter")}
                    onChange={() => togglePlatform("twitter")}
                    className="w-4 h-4"
                  />
                  <span>Twitter</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes("instagram")}
                    onChange={() => togglePlatform("instagram")}
                    className="w-4 h-4"
                  />
                  <span>Instagram</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
              >
                Create Campaign
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-surface-hover text-text-secondary px-4 py-2 rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-surface-muted border rounded-lg p-8 text-center">
            <p className="text-text-secondary">No campaigns yet. Create your first campaign to get started.</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-surface border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-text-secondary text-sm mt-1">{campaign.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.status === "active"
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "paused"
                        ? "bg-yellow-100 text-yellow-800"
                        : campaign.status === "completed"
                        ? "bg-surface-hover text-text-primary"
                        : "bg-brand-light text-brand-primary"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-text-secondary mb-4">
                <div>
                  <span className="font-medium">Platforms:</span>{" "}
                  {campaign.platforms.join(", ")}
                </div>
                {campaign.targetGoals && campaign.targetGoals.length > 0 && (
                  <div>
                    <span className="font-medium">Target Goals:</span>{" "}
                    {campaign.targetGoals.length}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {campaign.status === "draft" && (
                  <button
                    onClick={() => handleUpdate(campaign.id, { status: "active" })}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Activate
                  </button>
                )}
                {campaign.status === "active" && (
                  <button
                    onClick={() => handleUpdate(campaign.id, { status: "paused" })}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                  >
                    Pause
                  </button>
                )}
                {campaign.status === "paused" && (
                  <button
                    onClick={() => handleUpdate(campaign.id, { status: "active" })}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
