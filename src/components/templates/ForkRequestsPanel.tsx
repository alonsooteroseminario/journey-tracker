"use client";

import {
  useGetForkRequestsQuery,
  useRespondToForkRequestMutation,
} from "@/store/slices/templatesSlice";

export function ForkRequestsPanel() {
  const { data: requests, isLoading } = useGetForkRequestsQuery();
  const [respond, { isLoading: isResponding }] = useRespondToForkRequestMutation();

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];

  if (isLoading) {
    return null;
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  const handleRespond = async (requestId: string, status: "approved" | "rejected") => {
    try {
      await respond({ requestId, status }).unwrap();
    } catch (error) {
      console.error("Failed to respond to fork request:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-purple-200">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">
          {pendingRequests.length}
        </span>
        Fork Requests
      </h2>
      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg p-3 sm:p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              {request.requester?.profileImage ? (
                <img
                  src={request.requester.profileImage}
                  alt={request.requester.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(request.requester?.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">
                  {request.requester?.name || "Unknown"} wants to fork{" "}
                  <span className="font-semibold">
                    {request.template?.icon} {request.template?.title}
                  </span>
                </p>
                {request.message && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    &ldquo;{request.message}&rdquo;
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond(request.id, "approved")}
                disabled={isResponding}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleRespond(request.id, "rejected")}
                disabled={isResponding}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
