import { FeedList } from "@/components/feed/FeedList";

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            📰 Activity Feed
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            See what you and your friends are accomplishing
          </p>
        </div>

        {/* Feed List */}
        <FeedList />
      </div>
    </div>
  );
}
