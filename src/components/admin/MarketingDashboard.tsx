"use client";

import { useState } from "react";
import { AdminChatWidget } from "./AdminChatWidget";
import { useGetCampaignsQuery, useGetSocialPostsQuery } from "@/store/slices/adminSlice";

export function MarketingDashboard() {
  const [activePanel, setActivePanel] = useState<"campaigns" | "posts">("campaigns");
  const { data: campaignsData } = useGetCampaignsQuery();
  const { data: postsData } = useGetSocialPostsQuery();

  const campaigns = campaignsData?.campaigns || [];
  const posts = postsData?.posts || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Content Overview */}
      <div className="flex flex-col space-y-4 overflow-y-auto">
        {/* Panel Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActivePanel("campaigns")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activePanel === "campaigns"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActivePanel("posts")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activePanel === "posts"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Recent Posts ({posts.slice(0, 10).length})
          </button>
        </div>

        {/* Campaigns Panel */}
        {activePanel === "campaigns" && (
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="bg-surface-muted border rounded-lg p-8 text-center">
                <p className="text-text-secondary">
                  No campaigns yet. Use the chat assistant to create your first campaign.
                </p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-surface border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
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
                  {campaign.description && (
                    <p className="text-sm text-text-secondary mb-3">{campaign.description}</p>
                  )}
                  <div className="flex gap-3 text-xs text-text-secondary">
                    <span>📱 {campaign.platforms.join(", ")}</span>
                    {campaign.targetGoals && campaign.targetGoals.length > 0 && (
                      <span>🎯 {campaign.targetGoals.length} goals</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Posts Panel */}
        {activePanel === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-surface-muted border rounded-lg p-8 text-center">
                <p className="text-text-secondary">
                  No posts yet. Use the chat assistant to generate social media content.
                </p>
              </div>
            ) : (
              posts.slice(0, 10).map((post) => (
                <div key={post.id} className="bg-surface border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {post.account.platform === "twitter" ? "𝕏" : "📷"}
                      </span>
                      <span className="text-sm font-medium">
                        @{post.account.username}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === "posted"
                          ? "bg-green-100 text-green-800"
                          : post.status === "scheduled"
                          ? "bg-brand-light text-brand-dark"
                          : post.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-surface-hover text-text-primary"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary mb-2 line-clamp-3">
                    {post.content}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs text-brand-primary">
                      {post.hashtags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Chat Assistant */}
      <div className="h-full">
        <AdminChatWidget />
      </div>
    </div>
  );
}
