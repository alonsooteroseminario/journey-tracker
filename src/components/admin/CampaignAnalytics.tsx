"use client";

import { useGetCampaignQuery } from "@/store/slices/adminSlice";
import { useEffect, useState } from "react";
import { getABTestResults, ABTestResults } from "@/lib/admin/campaigns/abTest";

interface CampaignAnalyticsProps {
  campaignId: string;
}

export function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const { data, isLoading, error } = useGetCampaignQuery(campaignId);
  const [abTestResults, setAbTestResults] = useState<ABTestResults | null>(null);
  const [loadingABTest, setLoadingABTest] = useState(false);

  const campaign = data?.campaign;

  // Load A/B test results if enabled
  useEffect(() => {
    if (campaign?.abTestEnabled) {
      setLoadingABTest(true);
      fetch(`/api/admin/campaigns/${campaignId}/ab-test`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            setAbTestResults(data.results);
          }
        })
        .catch((err) => console.error("Error loading A/B test results:", err))
        .finally(() => setLoadingABTest(false));
    }
  }, [campaign, campaignId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load campaign analytics</p>
      </div>
    );
  }

  const posts = campaign.posts || [];
  const postedPosts = posts.filter((p: any) => p.status === "posted");

  // Calculate aggregate metrics
  const totalImpressions = postedPosts.reduce(
    (sum: number, p: any) => sum + (p.impressions || 0),
    0
  );
  const totalLikes = postedPosts.reduce(
    (sum: number, p: any) => sum + (p.likes || 0),
    0
  );
  const totalRetweets = postedPosts.reduce(
    (sum: number, p: any) => sum + (p.retweets || 0),
    0
  );
  const totalComments = postedPosts.reduce(
    (sum: number, p: any) => sum + (p.comments || 0),
    0
  );
  const totalClicks = postedPosts.reduce(
    (sum: number, p: any) => sum + (p.clicks || 0),
    0
  );
  const totalEngagement = totalLikes + totalRetweets + totalComments + totalClicks;

  const avgEngagementRate =
    postedPosts.length > 0 && totalImpressions > 0
      ? ((totalEngagement / totalImpressions) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{campaign.name}</h2>
        {campaign.description && (
          <p className="text-gray-600">{campaign.description}</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Impressions"
          value={totalImpressions.toLocaleString()}
          icon="👁️"
        />
        <MetricCard
          label="Total Engagement"
          value={totalEngagement.toLocaleString()}
          icon="❤️"
        />
        <MetricCard
          label="Engagement Rate"
          value={`${avgEngagementRate}%`}
          icon="📊"
        />
        <MetricCard
          label="Posts Published"
          value={postedPosts.length.toString()}
          icon="📝"
        />
      </div>

      {/* Engagement Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-brand-primary">
              {totalLikes.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Likes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {totalRetweets.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Shares</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-primary">
              {totalComments.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Comments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Clicks</div>
          </div>
        </div>
      </div>

      {/* A/B Test Results */}
      {campaign.abTestEnabled && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">A/B Test Results</h3>
          {loadingABTest ? (
            <div className="text-gray-600">Loading A/B test results...</div>
          ) : abTestResults ? (
            <div className="space-y-4">
              {/* Winner Badge */}
              {abTestResults.winner !== "insufficient_data" &&
                abTestResults.winner !== "tie" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <div className="font-semibold text-green-800">
                          Variant {abTestResults.winner} is winning!
                        </div>
                        <div className="text-sm text-green-600">
                          {abTestResults.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Comparison Table */}
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-700">Metric</div>
                <div className="font-medium text-gray-700 text-center">
                  Variant A ({abTestResults.variantA.posts} posts)
                </div>
                <div className="font-medium text-gray-700 text-center">
                  Variant B ({abTestResults.variantB.posts} posts)
                </div>

                <div className="text-sm text-gray-600">Avg Impressions</div>
                <div className="text-center">
                  {abTestResults.variantA.avgImpressions.toLocaleString()}
                </div>
                <div className="text-center">
                  {abTestResults.variantB.avgImpressions.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600">Avg Likes</div>
                <div className="text-center">
                  {abTestResults.variantA.avgLikes.toLocaleString()}
                </div>
                <div className="text-center">
                  {abTestResults.variantB.avgLikes.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600">Avg Shares</div>
                <div className="text-center">
                  {abTestResults.variantA.avgRetweets.toLocaleString()}
                </div>
                <div className="text-center">
                  {abTestResults.variantB.avgRetweets.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600">Avg Comments</div>
                <div className="text-center">
                  {abTestResults.variantA.avgComments.toLocaleString()}
                </div>
                <div className="text-center">
                  {abTestResults.variantB.avgComments.toLocaleString()}
                </div>

                <div className="text-sm text-gray-600 font-medium">
                  Total Engagement
                </div>
                <div className="text-center font-medium">
                  {abTestResults.variantA.totalEngagement.toLocaleString()}
                </div>
                <div className="text-center font-medium">
                  {abTestResults.variantB.totalEngagement.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">No A/B test data available</div>
          )}
        </div>
      )}

      {/* Top Performing Posts */}
      {postedPosts.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {postedPosts
              .sort(
                (a: any, b: any) =>
                  (b.likes || 0) +
                  (b.retweets || 0) +
                  (b.comments || 0) -
                  ((a.likes || 0) + (a.retweets || 0) + (a.comments || 0))
              )
              .slice(0, 5)
              .map((post: any) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    {post.abTestGroup && (
                      <span className="text-xs text-gray-500 mt-1">
                        Variant {post.abTestGroup}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm ml-4">
                    <span>👁️ {(post.impressions || 0).toLocaleString()}</span>
                    <span>❤️ {(post.likes || 0).toLocaleString()}</span>
                    <span>🔁 {(post.retweets || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
