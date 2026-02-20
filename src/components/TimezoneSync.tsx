"use client";

import { useEffect, useRef } from "react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/slices/profileSlice";

/**
 * Detects the browser's IANA timezone and saves it to the user profile
 * if no timezone is set yet. Runs once per session.
 */
export function TimezoneSync() {
  const { data: profile } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current || !profile) return;

    if (!profile.timezone) {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTimezone) {
        synced.current = true;
        updateProfile({ timezone: browserTimezone });
      }
    } else {
      synced.current = true;
    }
  }, [profile, updateProfile]);

  return null;
}
