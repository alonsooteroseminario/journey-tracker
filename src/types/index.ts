// Task status enum
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface TaskStatusInfo {
  label: string;
  color: string; // Tailwind color class
  icon: string; // Emoji
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusInfo> = {
  not_started: { label: 'Not Started', color: 'gray', icon: '⏳' },
  in_progress: { label: 'In Progress', color: 'blue', icon: '🔄' },
  completed: { label: 'Completed', color: 'green', icon: '✅' },
};

// Substep for breaking down tasks further
export interface Substep {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  completedAt?: string; // ISO date string — set when status → 'completed'
  startedAt?: string; // ISO date string — set when status → 'in_progress'
  cost?: number; // Actual cost in CAD
  estimatedCost?: number; // Planned cost
  dueDate?: string; // ISO date string
  notes?: string;
  order: number;
  isArchived?: boolean;
  archivedAt?: string;
  lockLevel?: 'none' | 'soft' | 'hard';
  lockedAt?: string; // ISO date — set when lockLevel is changed from 'none'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  completedAt?: string; // ISO date string — set when status → 'completed'
  startedAt?: string; // ISO date string — set when status → 'in_progress'
  order: number;
  phase?: string;
  stepNumber?: string;
  documentsNeeded?: string;
  cost?: string; // Display cost string
  actualCost?: number; // Actual cost in CAD (editable)
  estimatedCost?: number; // Planned cost in CAD
  dueDate?: string; // ISO date string
  startDate?: string; // When journey task was started (semantic, user-set)
  notes?: string; // User notes
  substeps?: Substep[]; // Mini-tasks within this task
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  isArchived?: boolean;
  archivedAt?: string;
  lockLevel?: 'none' | 'soft' | 'hard';
  lockedAt?: string; // ISO date — set when lockLevel is changed from 'none'
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  phases?: Phase[];
  budget?: BudgetSummary;
  timeline?: TimelineComparison;
  documents?: DocumentItem[];
  resources?: ResourceCategory[];
  targetDate?: string; // Goal completion target
  startDate?: string; // When journey started
  order?: number; // User-defined display order
  groupId?: string; // Goal group assignment
}

export interface GoalGroup {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  taskIds: string[];
  estimatedDuration?: string;
  targetStartDate?: string;
  targetEndDate?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string (date only, no time)
  streakHistory: string[]; // Array of ISO date strings when tasks were completed
}

export interface GoalStreak {
  id: string;
  goalId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate?: string;
  streakHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export type StreakTier = "bronze" | "silver" | "gold" | null;

export interface StreakTierSummary {
  goalStreaks: Array<GoalStreak & { goalTitle: string; goalIcon?: string; tier: StreakTier }>;
  hasGold: boolean;
  silverCount: number;
  bronzeCount: number;
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  profileImage?: string; // Base64 or URL
  joinedDate: string;
  location?: string;
  timezone?: string;
  hideCompletedAfterDays?: number | null;
}

// Friend
export interface Friend {
  id: string;
  profileId: string;
  name: string;
  profileImage?: string;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
  sharedData?: FriendSharedData;
  addedDate: string;
}

// Friend Shared Data (what friends share with each other)
export interface FriendSharedData {
  streak: StreakData;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    startDate: string;
    targetDate?: string;
  }>;
  recentActivity: ActivityLogEntry[];
}

// Invitation
export interface Invitation {
  id: string;
  code: string;
  createdDate: string;
  expiresDate: string;
  used: boolean;
  usedBy?: string;
  usedDate?: string;
}

// Social Share
export interface SocialShare {
  id: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'custom';
  sharedDate: string;
  streakAtTime: number;
  message: string;
}

// Activity tracking for analytics
export interface ActivityLogEntry {
  id: string;
  date: string;
  type:
    // Goal events
    | 'goal_created' | 'goal_updated' | 'goal_deleted'
    // Task events
    | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed'
    // Substep events
    | 'substep_created' | 'substep_updated' | 'substep_deleted' | 'substep_status_changed'
    // Other events
    | 'cost_updated' | 'note_updated'
    | 'profile_updated' | 'friend_changed' | 'template_action'
    // Legacy types (backwards compat)
    | 'task_completed' | 'task_uncompleted' | 'task_started'
    | 'substep_completed' | 'substep_uncompleted'
    | 'cost_added' | 'note_added';
  goalId: string;
  taskId?: string;
  substepId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Analytics Types
export interface GoalBreakdown {
  goalId: string;
  title: string;
  completionRate: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface PhaseCompletion {
  phaseId: string;
  name: string;
  completionRate: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  totalSubsteps: number;
  completedSubsteps: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  averageTasksPerDay: number;
  projectedCompletionDate: string | null;
  daysRemaining: number | null;
  completionRate: number; // percentage
  weeklyProgress: WeeklyProgress[];
  monthlyProgress: MonthlyProgress[];
  costByPhase: CostByPhase[];
  velocityTrend: VelocityPoint[];
  goalBreakdown?: GoalBreakdown[];
  phaseCompletion?: PhaseCompletion[];
  mostProductiveDay?: { day: string; count: number };
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  substepsCompleted: number;
  costSpent: number;
}

export interface MonthlyProgress {
  month: string;
  year: number;
  tasksCompleted: number;
  substepsCompleted: number;
  costSpent: number;
}

export interface CostByPhase {
  phase: string;
  estimated: number;
  actual: number;
  remaining: number;
}

export interface VelocityPoint {
  date: string;
  velocity: number; // tasks per day
  cumulativeCompleted: number;
}

// Budget Types
export interface BudgetItem {
  phase: string;
  item: string;
  cost: string;
  timing: string;
  notes: string;
}

export interface BudgetSummary {
  items: BudgetItem[];
  totalBase: string;
  totalExpressEntry: string;
  difference: string;
  timeSaved: string;
}

// Timeline Types
export interface TimelinePhase {
  phase: string;
  baseOption: string;
  expressOption: string;
  timeSaved: string;
}

export interface TimelineComparison {
  phases: TimelinePhase[];
  totalBase: string;
  totalExpress: string;
  totalTimeSaved: string;
  baseAdvantages: string[];
  expressAdvantages: string[];
}

// Document Checklist Types
export interface DocumentItem {
  id: string;
  name: string;
  requiredFor: string;
  whenNeeded: string;
  status: 'pending' | 'obtained' | 'submitted';
  notes?: string;
  obtainedDate?: string;
  submittedDate?: string;
  cost?: number;
}

// Resources Types
export interface Resource {
  name: string;
  url: string;
}

export interface ResourceCategory {
  category: string;
  resources: Resource[];
}

// Email Preferences
export interface EmailPreferences {
  id: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  welcomeEmail: boolean;
  profileChanges: boolean;
  goalCreated: boolean;
  goalDeleted: boolean;
  friendInvitation: boolean;
  goalPublished: boolean;
  goalShared: boolean;
  goalForked: boolean;
  streakMilestone: boolean;
  streakReminder: boolean;
  friendStreakReminder: boolean;
  friendActivity: boolean;
}

export type NotificationType = keyof Omit<EmailPreferences, 'id' | 'enabled' | 'frequency'>;

// Feed Preferences
export interface FeedPreferences {
  id: string;
  goalEvents: boolean;
  taskEvents: boolean;
  substepEvents: boolean;
  costEvents: boolean;
  noteEvents: boolean;
  streakEvents: boolean;
  profileEvents: boolean;
  socialEvents: boolean;
}

export type FeedPreferenceCategory = keyof Omit<FeedPreferences, 'id'>;

// Social Feed
export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  type:
    | 'streak_milestone' | 'streak_at_risk'
    | 'goal_created' | 'goal_updated' | 'goal_deleted'
    | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed'
    | 'substep_created' | 'substep_updated' | 'substep_deleted' | 'substep_status_changed'
    | 'cost_updated' | 'note_updated'
    | 'profile_updated' | 'friend_changed' | 'template_action'
    | 'goal_shared' | 'goal_published' | 'goal_forked'
    // Legacy
    | 'task_completed';
  content: string;
  metadata?: Record<string, unknown>;
  visibility: 'friends' | 'public';
  comments: FeedComment[];
  cheers: FeedCheer[];
  cheerCount: number;
  hasCheered: boolean;
  createdAt: string;
}

export interface FeedComment {
  id: string;
  feedItemId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

export interface FeedCheer {
  id: string;
  feedItemId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

// Goal Template & Marketplace
export interface GoalTemplate {
  id: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    profileImage?: string | null;
  };
  originalGoalId: string;
  title: string;
  description?: string;
  icon?: string | null;
  tasks: Task[] | unknown;
  phases?: Phase[] | unknown;
  timeline?: TimelineComparison | unknown;
  resources?: ResourceCategory[] | unknown;
  lessonsLearned?: string;
  tips?: string;
  estimatedDuration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'friends' | 'public';
  isPublished: boolean;
  category?: string;
  tags: string[];
  forkCount: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface GoalFork {
  id: string;
  templateId: string;
  userId: string;
  newGoalId: string;
  forkedAt: string;
}

export interface ForkRequest {
  id: string;
  templateId: string;
  requesterId: string;
  requester?: {
    id: string;
    name: string;
    profileImage?: string | null;
  };
  template?: GoalTemplate;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Calendar Types
export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasActivity: boolean;
  tasksCompleted: number;
  substepsCompleted: number;
  costSpent: number;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'task_due' | 'task_completed' | 'milestone' | 'reminder';
  date: string;
  taskId?: string;
  color?: string;
}
