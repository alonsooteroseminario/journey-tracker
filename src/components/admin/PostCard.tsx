"use client";

import { useState } from "react";
import type { SocialPostWithAccount } from "@/types/admin";
import {
  useDeleteSocialPostMutation,
  usePublishSocialPostMutation,
} from "@/store/slices/adminSlice";

interface PostCardProps {
  post: SocialPostWithAccount;
  onEdit: (post: SocialPostWithAccount) => void;
}

const STATUS_COLORS = {
  draft: "bg-zinc-700 text-zinc-300",
  scheduled: "bg-brand-primary/20 text-brand-muted",
  posted: "bg-green-900/30 text-green-400",
  failed: "bg-red-900/30 text-red-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: "𝕏",
  instagram: "📷",
};

export function PostCard({ post, onEdit }: PostCardProps) {
  const [deletePost, { isLoading: isDeleting }] = useDeleteSocialPostMutation();
  const [publishPost, { isLoading: isPublishing }] = usePublishSocialPostMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePost(post.id).unwrap();
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    }
  };

  const handlePublish = async () => {
    try {
      await publishPost(post.id).unwrap();
    } catch (error) {
      console.error("Failed to publish post:", error);
      alert(`Failed to publish: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const canEdit = post.status === "draft" || post.status === "scheduled";
  const canPublish = post.status === "draft" || post.status === "scheduled";
  const canDelete = post.status !== "posted";

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {PLATFORM_ICONS[post.account.platform] || "🔗"}
          </span>
          <div>
            <p className="text-sm text-zinc-400">
              @{post.account.username}
            </p>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded capitalize ${
                STATUS_COLORS[post.status]
              }`}
            >
              {post.status}
            </span>
          </div>
        </div>
        {post.account.profileImage && (
          <img
            src={post.account.profileImage}
            alt={post.account.username}
            className="w-8 h-8 rounded-full"
          />
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm whitespace-pre-wrap line-clamp-3">
          {post.content}
        </p>
        {post.hashtags.length > 0 && (
          <p className="text-xs text-brand-muted mt-1">
            {post.hashtags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
      </div>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {post.mediaUrls.slice(0, 3).map((url, idx) => (
            <div
              key={idx}
              className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center text-xs"
            >
              🖼️
            </div>
          ))}
          {post.mediaUrls.length > 3 && (
            <div className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center text-xs">
              +{post.mediaUrls.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Scheduled/Posted time */}
      <div className="mb-3 text-xs text-zinc-500">
        {post.status === "scheduled" && post.scheduledFor && (
          <p>
            📅 Scheduled for{" "}
            {new Date(post.scheduledFor).toLocaleString()}
          </p>
        )}
        {post.status === "posted" && post.postedAt && (
          <p>
            ✓ Posted {new Date(post.postedAt).toLocaleString()}
          </p>
        )}
        {post.status === "failed" && post.error && (
          <p className="text-red-400">
            ✗ Error: {post.error}
          </p>
        )}
      </div>

      {/* Post URL */}
      {post.postUrl && (
        <a
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-muted hover:underline block mb-3"
        >
          View on {post.account.platform} →
        </a>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {canEdit && (
          <button
            onClick={() => onEdit(post)}
            className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition"
          >
            Edit
          </button>
        )}
        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-3 py-1.5 text-sm bg-brand-primary hover:bg-brand-secondary rounded transition disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish Now"}
          </button>
        )}
        {canDelete && (
          showConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm"}
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
              Delete
            </button>
          )
        )}
      </div>
    </div>
  );
}
