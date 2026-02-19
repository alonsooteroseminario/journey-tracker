import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackActivity } from '../trackActivity';
import { prisma } from '@/lib/prisma';

describe('trackActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);
    vi.mocked(prisma.feedItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.feedPreferences.findUnique).mockResolvedValue(null);
  });

  it('always creates an ActivityLog entry', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'task_created',
      action: 'Created task "Buy materials"',
      goalId: 'goal-1',
      taskId: 'task-1',
    });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'task_created',
        action: 'Created task "Buy materials"',
        goalId: 'goal-1',
        taskId: 'task-1',
      }),
    });
  });

  it('creates a FeedItem when no FeedPreferences exist (default ON)', async () => {
    vi.mocked(prisma.feedPreferences.findUnique).mockResolvedValue(null);

    await trackActivity({
      userId: 'user-1',
      type: 'task_created',
      action: 'Created task "Buy materials"',
    });

    expect(prisma.feedItem.create).toHaveBeenCalledOnce();
    expect(prisma.feedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'task_created',
        content: 'Created task "Buy materials"',
        visibility: 'friends',
      }),
    });
  });

  it('skips FeedItem when category is disabled in FeedPreferences', async () => {
    vi.mocked(prisma.feedPreferences.findUnique).mockResolvedValue({
      id: 'prefs-1',
      userId: 'user-1',
      goalEvents: true,
      taskEvents: false, // tasks disabled
      substepEvents: true,
      costEvents: true,
      noteEvents: true,
      profileEvents: true,
      socialEvents: true,
      streakEvents: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await trackActivity({
      userId: 'user-1',
      type: 'task_created',
      action: 'Created task "Buy materials"',
    });

    expect(prisma.activityLog.create).toHaveBeenCalledOnce();
    expect(prisma.feedItem.create).not.toHaveBeenCalled();
  });

  it('creates FeedItem when category is enabled in FeedPreferences', async () => {
    vi.mocked(prisma.feedPreferences.findUnique).mockResolvedValue({
      id: 'prefs-1',
      userId: 'user-1',
      goalEvents: true,
      taskEvents: true, // tasks enabled
      substepEvents: true,
      costEvents: true,
      noteEvents: true,
      profileEvents: true,
      socialEvents: true,
      streakEvents: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await trackActivity({
      userId: 'user-1',
      type: 'task_status_changed',
      action: 'Changed task status to in_progress',
    });

    expect(prisma.feedItem.create).toHaveBeenCalledOnce();
  });

  it('forces FeedItem creation when createFeedItem=true regardless of category', async () => {
    vi.mocked(prisma.feedPreferences.findUnique).mockResolvedValue({
      id: 'prefs-1',
      userId: 'user-1',
      goalEvents: false,
      taskEvents: false,
      substepEvents: false,
      costEvents: false,
      noteEvents: false,
      profileEvents: false,
      socialEvents: false,
      streakEvents: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await trackActivity({
      userId: 'user-1',
      type: 'streak_milestone',
      action: '🔥 7-day streak!',
      createFeedItem: true,
    });

    expect(prisma.feedItem.create).toHaveBeenCalledOnce();
  });

  it('skips FeedItem for unknown activity type with no force flag', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'some_unknown_type',
      action: 'Did something',
    });

    expect(prisma.activityLog.create).toHaveBeenCalledOnce();
    expect(prisma.feedItem.create).not.toHaveBeenCalled();
  });

  it('uses feedContent instead of action for FeedItem when provided', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Changed goal "Build House" title from "Build H" to "Build House"',
      feedContent: 'Updated goal "Build House"',
    });

    expect(prisma.feedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: 'Updated goal "Build House"',
      }),
    });
  });

  it('stores metadata on both ActivityLog and FeedItem', async () => {
    const metadata = { diffs: [{ field: 'title', oldValue: 'A', newValue: 'B' }] };

    await trackActivity({
      userId: 'user-1',
      type: 'task_updated',
      action: 'Updated task',
      metadata,
    });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ metadata }),
    });
    expect(prisma.feedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ metadata }),
    });
  });

  it('respects feedVisibility override', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'goal_published',
      action: 'Published goal to marketplace',
      feedVisibility: 'public',
    });

    expect(prisma.feedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ visibility: 'public' }),
    });
  });
});
