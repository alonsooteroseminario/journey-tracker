// Substep for breaking down tasks further
export interface Substep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  cost?: number; // Actual cost in CAD
  estimatedCost?: number; // Planned cost
  dueDate?: string; // ISO date string
  notes?: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO date string
  order: number;
  phase?: string;
  stepNumber?: string;
  documentsNeeded?: string;
  cost?: string; // Display cost string
  actualCost?: number; // Actual cost in CAD (editable)
  estimatedCost?: number; // Planned cost in CAD
  dueDate?: string; // ISO date string
  startDate?: string; // When task was started
  notes?: string; // User notes
  substeps?: Substep[]; // Mini-tasks within this task
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
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
  type: 'task_completed' | 'task_uncompleted' | 'task_started' | 'substep_completed' | 'substep_uncompleted' | 'cost_added' | 'note_added' | 'goal_created';
  goalId: string;
  taskId?: string;
  substepId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// Analytics Types
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
