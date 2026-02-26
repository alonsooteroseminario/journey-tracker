"use client";

import { useState, useEffect } from "react";
import type { SocialAccount, SocialPostWithAccount } from "@/types/admin";
import {
  useCreateSocialPostMutation,
  useUpdateSocialPostMutation,
} from "@/store/slices/adminSlice";

interface PostEditorProps {
  accounts: SocialAccount[];
  editingPost: SocialPostWithAccount | null;
  onClose: () => void;
}

const PLATFORM_LIMITS: Record<string, { maxLength: number; maxMedia: number }> = {
  twitter: { maxLength: 280, maxMedia: 4 },
  instagram: { maxLength: 2200, maxMedia: 10 },
};

export function PostEditor({ accounts, editingPost, onClose }: PostEditorProps) {
  const [createPost, { isLoading: isCreating }] = useCreateSocialPostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateSocialPostMutation();

  const [accountId, setAccountId] = useState(editingPost?.accountId || "");
  const [content, setContent] = useState(editingPost?.content || "");
  const [hashtags, setHashtags] = useState(
    editingPost?.hashtags.join(" ") || ""
  );
  const [scheduledFor, setScheduledFor] = useState(
    editingPost?.scheduledFor
      ? new Date(editingPost.scheduledFor).toISOString().slice(0, 16)
      : ""
  );

  const selectedAccount = accounts.find((acc) => acc.id === accountId);
  const platform = selectedAccount?.platform || "twitter";
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.twitter;

  const charsLeft = limits.maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hashtagsArray = hashtags
      .split(" ")
      .filter((tag) => tag.trim())
      .map((tag) => tag.replace("#", ""));

    try {
      if (editingPost) {
        await updatePost({
          id: editingPost.id,
          data: {
            content,
            hashtags: hashtagsArray,
            scheduledFor: scheduledFor || null,
          },
        }).unwrap();
      } else {
        await createPost({
          accountId,
          content,
          hashtags: hashtagsArray,
          scheduledFor: scheduledFor || undefined,
          mediaUrls: [],
        }).unwrap();
      }
      onClose();
    } catch (error) {
      console.error("Failed to save post:", error);
      alert(
        `Failed to save post: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {editingPost ? "Edit Post" : "Create Post"}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account selector */}
            {!editingPost && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Social Account *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                >
                  <option value="">Select account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.platform === "twitter" ? "𝕏" : "📷"} @
                      {account.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
                <span
                  className={`ml-2 ${
                    charsLeft < 0 ? "text-red-400" : "text-zinc-500"
                  }`}
                >
                  {charsLeft} characters left
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                maxLength={limits.maxLength}
                placeholder={`Write your ${platform} post...`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 resize-none"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Hashtags (optional)
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="tag1 tag2 tag3 (space-separated, no #)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Leave empty to save as draft
              </p>
            </div>

            {/* Info */}
            <div className="bg-zinc-800 border border-zinc-700 rounded p-3 text-sm text-zinc-400">
              <p className="font-medium mb-1">Platform Limits:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Max {limits.maxLength} characters</li>
                <li>• Max {limits.maxMedia} media attachments</li>
                {platform === "instagram" && (
                  <li>• At least 1 image required</li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || charsLeft < 0}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Saving..."
                  : editingPost
                  ? "Update Post"
                  : scheduledFor
                  ? "Schedule Post"
                  : "Save Draft"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
