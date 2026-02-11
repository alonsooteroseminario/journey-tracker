"use client";

import { useState } from "react";
import { useLazyInitiateSocialConnectQuery } from "@/store/slices/adminSlice";
import type { SocialPlatform } from "@/types/admin";

interface ConnectPlatformButtonProps {
  platform: SocialPlatform;
  label: string;
  icon: string;
  colorClass: string;
  disabled?: boolean;
}

export function ConnectPlatformButton({
  platform,
  label,
  icon,
  colorClass,
  disabled,
}: ConnectPlatformButtonProps) {
  const [trigger, { isLoading }] = useLazyInitiateSocialConnectQuery();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const result = await trigger(platform).unwrap();
      // Redirect to OAuth page
      window.location.href = result.authUrl;
    } catch (err) {
      console.error(`Failed to initiate ${platform} connection:`, err);
      setError(`Failed to connect to ${platform}`);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={disabled || isLoading}
        className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
      >
        <span className="text-2xl">{icon}</span>
        <span>
          {isLoading ? "Connecting..." : `Connect ${label}`}
        </span>
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
