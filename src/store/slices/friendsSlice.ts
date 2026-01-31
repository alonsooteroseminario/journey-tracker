import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Friend, Invitation } from "@/types";

// ========== Friend data from API ==========
export interface ApiFriend {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  joinedDate: string;
  friendshipId: string;
  addedDate: string;
  status: string;
  // Stats computed server-side
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
}

// ========== RTK Query API ==========
export const friendsApi = createApi({
  reducerPath: "friendsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Friend", "Invitation"],
  endpoints: (builder) => ({
    // GET /api/friends
    getFriends: builder.query<ApiFriend[], void>({
      query: () => "/friends",
      providesTags: ["Friend"],
    }),

    // GET /api/friends/:friendId - Get friend profile details
    getFriendProfile: builder.query<ApiFriend & { goals: any[]; recentActivity: any[] }, string>({
      query: (friendId) => `/friends/${friendId}`,
      providesTags: (_result, _error, id) => [{ type: "Friend", id }],
    }),

    // POST /api/friends - Add a friend via invitation code
    addFriend: builder.mutation<ApiFriend, { code: string }>({
      query: (body) => ({
        url: "/friends",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Friend"],
    }),

    // DELETE /api/friends/:friendId
    removeFriend: builder.mutation<void, string>({
      query: (friendId) => ({
        url: `/friends/${friendId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Friend"],
    }),

    // POST /api/invitations - Create an invite code
    createInvitation: builder.mutation<Invitation, void>({
      query: () => ({
        url: "/invitations",
        method: "POST",
      }),
      invalidatesTags: ["Invitation"],
    }),

    // GET /api/invitations
    getInvitations: builder.query<Invitation[], void>({
      query: () => "/invitations",
      providesTags: ["Invitation"],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useGetFriendProfileQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
  useCreateInvitationMutation,
  useGetInvitationsQuery,
} = friendsApi;

// ========== Local UI State Slice ==========
interface FriendsUIState {
  selectedFriendId: string | null;
  showAddFriend: boolean;
  inviteCode: string;
}

const initialState: FriendsUIState = {
  selectedFriendId: null,
  showAddFriend: false,
  inviteCode: "",
};

const friendsSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    setSelectedFriend: (state, action: PayloadAction<string | null>) => {
      state.selectedFriendId = action.payload;
    },
    toggleAddFriend: (state) => {
      state.showAddFriend = !state.showAddFriend;
    },
    setInviteCode: (state, action: PayloadAction<string>) => {
      state.inviteCode = action.payload;
    },
  },
});

export const { setSelectedFriend, toggleAddFriend, setInviteCode } =
  friendsSlice.actions;
export default friendsSlice.reducer;
