import { prisma } from '@/lib/prisma';

// Maps activity types to FeedPreferences category keys
const ACTIVITY_TO_FEED_CATEGORY: Record<string, string> = {
  goal_created: 'goalEvents',
  goal_updated: 'goalEvents',
  goal_deleted: 'goalEvents',
  task_created: 'taskEvents',
  task_updated: 'taskEvents',
  task_deleted: 'taskEvents',
  task_status_changed: 'taskEvents',
  substep_created: 'substepEvents',
  substep_updated: 'substepEvents',
  substep_deleted: 'substepEvents',
  substep_status_changed: 'substepEvents',
  cost_updated: 'costEvents',
  note_updated: 'noteEvents',
  profile_updated: 'profileEvents',
  friend_changed: 'socialEvents',
  template_action: 'socialEvents',
  streak_milestone: 'streakEvents',
  streak_at_risk: 'streakEvents',
  goal_shared: 'socialEvents',
  goal_published: 'socialEvents',
  goal_forked: 'socialEvents',
};

export interface TrackActivityParams {
  userId: string;
  type: string;
  action: string; // Human-readable description
  goalId?: string;
  taskId?: string;
  substepId?: string;
  metadata?: Record<string, unknown>; // Before/after diffs, context, etc.
  /** Override: force feed item creation regardless of preferences (e.g. streak milestones) */
  createFeedItem?: boolean;
  /** Custom feed content if different from action string */
  feedContent?: string;
  feedVisibility?: 'friends' | 'public';
}

/**
 * Centralised activity tracking:
 * 1. Always writes an ActivityLog entry (personal analytics).
 * 2. Checks user's FeedPreferences and writes a FeedItem only when allowed.
 */
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  const {
    userId,
    type,
    action,
    goalId,
    taskId,
    substepId,
    metadata,
    createFeedItem: forceCreateFeed,
    feedContent,
    feedVisibility = 'friends',
  } = params;

  // 1. Always create ActivityLog entry
  await prisma.activityLog.create({
    data: {
      userId,
      type,
      action,
      goalId: goalId ?? undefined,
      taskId: taskId ?? undefined,
      substepId: substepId ?? undefined,
      metadata: (metadata ?? undefined) as any,
    },
  });

  // 2. Determine whether to create a FeedItem
  const feedCategory = ACTIVITY_TO_FEED_CATEGORY[type];
  if (!feedCategory && !forceCreateFeed) return;

  // forceCreateFeed bypasses all preference checks
  let shouldCreateFeed = forceCreateFeed === true ? true : null;

  if (shouldCreateFeed === null && feedCategory) {
    const feedPrefs = await prisma.feedPreferences.findUnique({
      where: { userId },
    });
    // No preferences record → all categories default to ON
    if (feedPrefs) {
      shouldCreateFeed = (feedPrefs as Record<string, unknown>)[feedCategory] as boolean ?? true;
    } else {
      shouldCreateFeed = true;
    }
  }

  if (!shouldCreateFeed) return;

  // 3. Create FeedItem
  await prisma.feedItem.create({
    data: {
      userId,
      type,
      content: feedContent ?? action,
      metadata: (metadata ?? undefined) as any,
      visibility: feedVisibility,
    },
  });
}
