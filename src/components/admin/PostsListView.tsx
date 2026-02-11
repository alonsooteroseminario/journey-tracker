"use client";

import { useState } from "react";
import {
  useGetSocialPostsQuery,
  useGetSocialAccountsQuery,
} from "@/store/slices/adminSlice";
import { PostCard } from "./PostCard";
import { PostEditor } from "./PostEditor";
import type { SocialPostWithAccount } from "@/types/admin";

export function PostsListView() {
  const { data: postsData, isLoading: postsLoading } = useGetSocialPostsQuery();
  const { data: accountsData, isLoading: accountsLoading } = useGetSocialAccountsQuery();

  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPostWithAccount | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const posts = postsData?.posts || [];
  const accounts = accountsData?.accounts || [];

  const handleEdit = (post: SocialPostWithAccount) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const filteredPosts =
    filterStatus === "all"
      ? posts
      : posts.filter((post) => post.status === filterStatus);

  const statusCounts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    posted: posts.filter((p) => p.status === "posted").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  if (postsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Social Media Posts</h1>
        <div className="border border-zinc-700 rounded-lg p-8 text-center text-zinc-400">
          <p className="mb-2">No social accounts connected.</p>
          <p className="text-sm">
            Please connect a social account first to create posts.
          </p>
          <a
            href="/admin/social"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-white"
          >
            Connect Account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Social Media Posts</h1>
        <button
          onClick={handleNewPost}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          + New Post
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "draft", label: "Drafts" },
          { key: "scheduled", label: "Scheduled" },
          { key: "posted", label: "Posted" },
          { key: "failed", label: "Failed" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            className={`px-4 py-2 rounded whitespace-nowrap transition ${
              filterStatus === filter.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {filter.label} ({statusCounts[filter.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {filteredPosts.length === 0 ? (
        <div className="border border-zinc-700 rounded-lg p-8 text-center text-zinc-400">
          <p className="mb-2">
            No {filterStatus !== "all" ? filterStatus : ""} posts yet.
          </p>
          <p className="text-sm">
            Create your first post to start scheduling content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Information */}
      <div className="mt-8 border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
        <h3 className="font-medium mb-2">📅 Automated Publishing</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Scheduled posts are automatically published at the set time</li>
          <li>• Check your post status for publishing errors</li>
          <li>• Draft posts can be edited and scheduled later</li>
          <li>• Posted content cannot be edited or deleted</li>
        </ul>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <PostEditor
          accounts={accounts}
          editingPost={editingPost}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
