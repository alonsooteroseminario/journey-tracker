"use client";

import { useCallback, useMemo } from "react";
import { Friend, Invitation } from "@/types";
import { getToday } from "@/lib/storage";
import {
  useGetFriendsQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
  useCreateInvitationMutation,
  useGetInvitationsQuery,
} from "@/store/slices/friendsSlice";

export function useFriendsData() {
  const {
    data: apiFriends,
    isLoading: friendsLoading,
  } = useGetFriendsQuery();

  const {
    data: apiInvitations,
  } = useGetInvitationsQuery();

  const [addFriendMutation] = useAddFriendMutation();
  const [removeFriendMutation] = useRemoveFriendMutation();
  const [createInvitationMutation] = useCreateInvitationMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const friends: Friend[] = useMemo(
    () =>
      (apiFriends || []).map((f: any) => ({
        id: f.id,
        profileId: f.clerkId || f.id,
        name: f.name,
        profileImage: f.profileImage,
        currentStreak: f.currentStreak ?? 0,
        longestStreak: f.longestStreak ?? 0,
        totalGoals: f.totalGoals ?? 0,
        completedGoals: f.completedGoals ?? 0,
        addedDate: f.addedDate || getToday(),
        sharedData: undefined,
      })),
    [apiFriends]
  );

  const invitations: Invitation[] = useMemo(
    () => apiInvitations || [],
    [apiInvitations]
  );

  const addFriend = useCallback(
    (friend: Friend) => {
      addFriendMutation({ code: friend.profileId });
    },
    [addFriendMutation]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      removeFriendMutation(friendId);
    },
    [removeFriendMutation]
  );

  const createInvitation = useCallback(async (): Promise<Invitation> => {
    const result = await createInvitationMutation().unwrap();
    return result as Invitation;
  }, [createInvitationMutation]);

  return {
    friends,
    friendsLoading,
    invitations,
    addFriend,
    removeFriend,
    createInvitation,
  };
}
