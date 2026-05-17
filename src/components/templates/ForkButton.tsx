"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForkTemplateMutation,
  useCreateForkRequestMutation,
  useGetForkRequestStatusQuery,
} from "@/store/slices/templatesSlice";

interface ForkButtonProps {
  templateId: string;
  templateTitle: string;
  isPublic?: boolean;
}

export function ForkButton({ templateId, templateTitle, isPublic = true }: ForkButtonProps) {
  const router = useRouter();
  const [forkTemplate, { isLoading: isForking }] = useForkTemplateMutation();
  const [createForkRequest, { isLoading: isRequesting }] = useCreateForkRequestMutation();
  const { data: existingRequest } = useGetForkRequestStatusQuery(templateId, {
    skip: isPublic,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState("");

  // Friends-only: show request status if one exists
  if (!isPublic && existingRequest) {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <div className={`w-full sm:flex-1 px-4 py-3 text-sm sm:text-base rounded-md text-center font-medium ${statusColors[existingRequest.status]}`}>
        {existingRequest.status === "pending" && "Fork request pending..."}
        {existingRequest.status === "approved" && "Fork request approved! Check your goals."}
        {existingRequest.status === "rejected" && "Fork request was declined"}
      </div>
    );
  }

  // Public template: direct fork flow
  const handleFork = async () => {
    try {
      const result = await forkTemplate({
        id: templateId,
        data: customTitle ? { customTitle } : {},
      }).unwrap();
      router.push(`/goals?id=${result.goalId}`);
    } catch (error) {
      console.error("Failed to fork template:", error);
    }
  };

  // Friends-only template: request flow
  const handleRequest = async () => {
    try {
      await createForkRequest({
        templateId,
        message: message || undefined,
      }).unwrap();
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to create fork request:", error);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        {isPublic ? "Fork This Template" : "Request to Fork"}
      </button>
    );
  }

  // Public fork confirmation
  if (isPublic) {
    return (
      <div className="w-full sm:flex-1 space-y-2 sm:space-y-3">
        <div className="bg-brand-light dark:bg-brand-primary/20 p-3 sm:p-4 rounded-md">
          <p className="text-xs sm:text-sm text-text-secondary mb-2 sm:mb-3">
            This will create a new goal based on this template. All tasks will start uncompleted.
          </p>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={templateTitle}
              className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white"
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary bg-surface-hover rounded-md hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleFork}
            disabled={isForking}
            className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isForking ? "Forking..." : "Confirm Fork"}
          </button>
        </div>
      </div>
    );
  }

  // Friends-only fork request confirmation
  return (
    <div className="w-full sm:flex-1 space-y-2 sm:space-y-3">
      <div className="bg-brand-light/40 dark:bg-brand-primary/20 p-3 sm:p-4 rounded-md">
        <p className="text-xs sm:text-sm text-text-secondary mb-2 sm:mb-3">
          This template requires the creator&apos;s permission to fork. Send a request and they&apos;ll be notified.
        </p>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">
            Message to creator (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why you'd like to fork this template..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm sm:text-base border border-border-strong rounded-md bg-surface text-text-primary dark:text-white resize-none"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary bg-surface-hover rounded-md hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
        >
          {isRequesting ? "Sending..." : "Send Request"}
        </button>
      </div>
    </div>
  );
}
