import { AppState, StreakData, UserProfile, Friend } from "@/types";

const STORAGE_KEY = "journey-tracker-state";

// Utility functions needed early
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakHistory: [],
};

const defaultProfile: UserProfile = {
  id: generateId(),
  name: "Journey Tracker",
  joinedDate: getToday(),
};

// Default example friends with contrasting stats
const defaultFriends: Friend[] = [
  {
    id: "friend-001",
    profileId: "FRIEND001",
    name: "Alex Johnson",
    profileImage: undefined,
    currentStreak: 42,
    longestStreak: 89,
    totalGoals: 1,
    completedGoals: 0,
    addedDate: "2025-12-15", // Older friend
    sharedData: {
      streak: {
        currentStreak: 42,
        longestStreak: 89,
        lastActivityDate: getToday(),
        streakHistory: Array(42).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (41 - i));
          return d.toISOString().split("T")[0];
        }),
      },
      goals: [
        {
          id: "alex-goal-1",
          title: "Run a Marathon",
          progress: 68,
          startDate: "2025-11-01",
          targetDate: "2026-04-15",
        }
      ],
      recentActivity: [],
    },
  },
  {
    id: "friend-002",
    profileId: "FRIEND002",
    name: "Maria Garcia",
    profileImage: undefined,
    currentStreak: 3,
    longestStreak: 12,
    totalGoals: 1,
    completedGoals: 0,
    addedDate: "2026-01-20", // Recent friend
    sharedData: {
      streak: {
        currentStreak: 3,
        longestStreak: 12,
        lastActivityDate: getToday(),
        streakHistory: Array(3).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (2 - i));
          return d.toISOString().split("T")[0];
        }),
      },
      goals: [
        {
          id: "maria-goal-1",
          title: "Learn Japanese",
          progress: 15,
          startDate: "2026-01-15",
          targetDate: "2026-12-31",
        }
      ],
      recentActivity: [],
    },
  },
  {
    id: "friend-003",
    profileId: "FRIEND003",
    name: "David Chen",
    profileImage: undefined,
    currentStreak: 0,
    longestStreak: 156,
    totalGoals: 1,
    completedGoals: 1,
    addedDate: "2025-10-01", // Oldest friend
    sharedData: {
      streak: {
        currentStreak: 0,
        longestStreak: 156,
        lastActivityDate: "2026-01-20", // Lost streak 8 days ago
        streakHistory: [],
      },
      goals: [
        {
          id: "david-goal-1",
          title: "Write a Novel",
          progress: 100,
          startDate: "2025-06-01",
          targetDate: "2026-01-15",
        }
      ],
      recentActivity: [],
    },
  },
  {
    id: "friend-004",
    profileId: "FRIEND004",
    name: "Sarah Williams",
    profileImage: undefined,
    currentStreak: 21,
    longestStreak: 21,
    totalGoals: 1,
    completedGoals: 0,
    addedDate: "2026-01-08",
    sharedData: {
      streak: {
        currentStreak: 21,
        longestStreak: 21,
        lastActivityDate: getToday(),
        streakHistory: Array(21).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (20 - i));
          return d.toISOString().split("T")[0];
        }),
      },
      goals: [
        {
          id: "sarah-goal-1",
          title: "Master Guitar",
          progress: 45,
          startDate: "2026-01-01",
          targetDate: "2026-06-30",
        }
      ],
      recentActivity: [],
    },
  },
];

const defaultState: AppState = {
  goals: [],
  streak: defaultStreak,
  notificationsEnabled: false,
  activityLog: [],
  profile: defaultProfile,
  friends: defaultFriends,
  invitations: [],
  socialShares: [],
};

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        streak: { ...defaultStreak, ...parsed.streak },
        activityLog: parsed.activityLog || [],
        profile: parsed.profile || defaultProfile,
        friends: parsed.friends || [],
        invitations: parsed.invitations || [],
        socialShares: parsed.socialShares || [],
      };
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
  }

  return defaultState;
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

export function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  return dateString === getToday();
}

export function isYesterday(dateString: string | null): boolean {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split("T")[0];
}

export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function parseCostString(costString: string): number {
  // Parse strings like "$256", "$300-400", "$0 (FREE)"
  const match = costString.match(/\$?([\d,]+)/);
  if (match) {
    return parseFloat(match[1].replace(",", ""));
  }
  return 0;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}
