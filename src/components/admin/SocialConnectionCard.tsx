"use client";

import { useState } from "react";
import type { SocialAccount } from "@/types/admin";
import {
  useDeleteSocialAccountMutation,
  useRefreshSocialTokenMutation,
} from "@/store/slices/adminSlice";

interface SocialConnectionCardProps {
  account: SocialAccount;
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: "𝕏",
  instagram: "📷",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-black text-white",
  instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white",
};

export function SocialConnectionCard({ account }: SocialConnectionCardProps) {
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteSocialAccountMutation();
  const [refreshToken, { isLoading: isRefreshing }] =
    useRefreshSocialTokenMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnect = async () => {
    try {
      await deleteAccount(account.id).unwrap();
    } catch (error) {
      console.error("Failed to disconnect account:", error);
      alert("Failed to disconnect account");
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshToken(account.id).unwrap();
      alert("Token refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh token:", error);
      alert("Failed to refresh token");
    }
  };

  const isExpired = account.tokenExpiresAt
    ? new Date(account.tokenExpiresAt) < new Date()
    : false;
  const expiresIn = account.tokenExpiresAt
    ? Math.floor(
        (new Date(account.tokenExpiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              PLATFORM_COLORS[account.platform] || "bg-zinc-700"
            }`}
          >
            {PLATFORM_ICONS[account.platform] || "🔗"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {account.displayName || account.username}
              </h3>
              {!account.isActive && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">@{account.username}</p>
            <p className="text-xs text-zinc-500 capitalize mt-1">
              {account.platform}
            </p>
          </div>
        </div>
        {account.profileImage && (
          <img
            src={account.profileImage}
            alt={account.username}
            className="w-10 h-10 rounded-full"
          />
        )}
      </div>

      {/* Token status */}
      <div className="mb-3 text-sm">
        {isExpired ? (
          <p className="text-red-400">⚠️ Token expired</p>
        ) : expiresIn !== null ? (
          <p className="text-zinc-400">
            Token expires in {expiresIn} day{expiresIn !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-zinc-400">Token valid</p>
        )}
      </div>

      {/* Metadata */}
      {account.metadata && (
        <div className="mb-3 text-xs text-zinc-500 space-y-1">
          {account.platform === "twitter" && (
            <>
              {account.metadata.followersCount !== undefined && (
                <p>Followers: {account.metadata.followersCount.toLocaleString()}</p>
              )}
              {account.metadata.verified && (
                <p className="text-brand-muted">✓ Verified</p>
              )}
            </>
          )}
          {account.platform === "instagram" && (
            <>
              {account.metadata.mediaCount !== undefined && (
                <p>Posts: {account.metadata.mediaCount}</p>
              )}
              {account.metadata.accountType && (
                <p className="capitalize">Type: {account.metadata.accountType}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !account.isActive}
          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Token"}
        </button>
        {showConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
            >
              {isDeleting ? "Disconnecting..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-red-400 rounded transition"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-700 text-xs text-zinc-500">
        Connected {new Date(account.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
