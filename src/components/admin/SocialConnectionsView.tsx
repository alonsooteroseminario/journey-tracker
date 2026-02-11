"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGetSocialAccountsQuery } from "@/store/slices/adminSlice";
import { SocialConnectionCard } from "./SocialConnectionCard";
import { ConnectPlatformButton } from "./ConnectPlatformButton";

export function SocialConnectionsView() {
  const { data, isLoading, error, refetch } = useGetSocialAccountsQuery();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");

  // Refetch on success/error from OAuth redirect
  useEffect(() => {
    if (successMessage || errorMessage) {
      refetch();
    }
  }, [successMessage, errorMessage, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
        Failed to load social accounts. Please try again.
      </div>
    );
  }

  const accounts = data?.accounts || [];
  const connectedPlatforms = new Set(accounts.map((acc) => acc.platform));

  return (
    <div className="max-w-4xl">
      {/* Alerts */}
      {successMessage === "connected" && (
        <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-400">
          ✓ Social account connected successfully!
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
          ✗ {decodeURIComponent(errorMessage)}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Social Media Connections</h1>
        <p className="text-zinc-400">
          Connect your social media accounts to enable automated posting and
          marketing campaigns.
        </p>
      </div>

      {/* Connect new platforms */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Connect Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConnectPlatformButton
            platform="twitter"
            label="X (Twitter)"
            icon="𝕏"
            colorClass="bg-black hover:bg-zinc-900 text-white"
            disabled={connectedPlatforms.has("twitter")}
          />
          <ConnectPlatformButton
            platform="instagram"
            label="Instagram"
            icon="📷"
            colorClass="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 text-white"
            disabled={connectedPlatforms.has("instagram")}
          />
        </div>
      </div>

      {/* Connected accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Connected Accounts ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <div className="border border-zinc-700 rounded-lg p-8 text-center text-zinc-400">
            <p className="mb-2">No social accounts connected yet.</p>
            <p className="text-sm">
              Connect a platform above to start automating your social media
              presence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <SocialConnectionCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="mt-8 border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
        <h3 className="font-medium mb-2">🔒 Security & Privacy</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Access tokens are encrypted using AES-256-GCM</li>
          <li>• Tokens are only used for automated posting from admin panel</li>
          <li>• You can disconnect an account at any time</li>
          <li>• Refresh tokens periodically to maintain access</li>
        </ul>
      </div>
    </div>
  );
}
