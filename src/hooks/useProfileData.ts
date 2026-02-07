"use client";

import { useCallback, useMemo } from "react";
import { UserProfile } from "@/types";
import { getToday } from "@/lib/storage";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/store/slices/profileSlice";

const defaultProfile: UserProfile = {
  id: "",
  name: "Loading...",
  joinedDate: getToday(),
};

export function useProfileData() {
  const {
    data: apiProfile,
    isLoading: profileLoading,
  } = useGetProfileQuery();

  const [updateProfileMutation] = useUpdateProfileMutation();

  const profile: UserProfile = useMemo(
    () => apiProfile || defaultProfile,
    [apiProfile]
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      updateProfileMutation(updates);
    },
    [updateProfileMutation]
  );

  return {
    profile,
    profileLoading,
    updateProfile,
  };
}
