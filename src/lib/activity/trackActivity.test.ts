import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackActivity } from './trackActivity';
import { prisma } from '@/lib/prisma';

// prisma is globally mocked in src/test/setup.ts
const mockActivityLogCreate = prisma.activityLog.create as ReturnType<typeof vi.fn>;
const mockFeedItemFindFirst = prisma.feedItem.findFirst as ReturnType<typeof vi.fn>;
const mockFeedItemCreate = prisma.feedItem.create as ReturnType<typeof vi.fn>;
const mockFeedPrefsFind = prisma.feedPreferences.findUnique as ReturnType<typeof vi.fn>;

describe('trackActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivityLogCreate.mockResolvedValue({});
    mockFeedPrefsFind.mockResolvedValue(null); // no prefs → all ON
  });

  it('always creates an ActivityLog entry', async () => {
    mockFeedItemFindFirst.mockResolvedValue(null);
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title',
      goalId: 'goal-1',
    });

    expect(mockActivityLogCreate).toHaveBeenCalledOnce();
    expect(mockActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'goal_updated',
          action: 'Updated goal title',
          goalId: 'goal-1',
        }),
      })
    );
  });

  it('creates a FeedItem when no recent duplicate exists', async () => {
    mockFeedItemFindFirst.mockResolvedValue(null); // no recent duplicate
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title',
    });

    expect(mockFeedItemCreate).toHaveBeenCalledOnce();
  });

  it('skips FeedItem creation when duplicate exists within 60s', async () => {
    // Simulate an existing recent feed item
    mockFeedItemFindFirst.mockResolvedValue({
      id: 'existing-feed-item',
      userId: 'user-1',
      type: 'goal_updated',
      createdAt: new Date(),
    });

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated goal title again',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
  });

  it('creates FeedItem when forceCreateFeed is true, even if duplicate exists', async () => {
    mockFeedItemFindFirst.mockResolvedValue({
      id: 'existing',
      userId: 'user-1',
      type: 'streak_milestone',
      createdAt: new Date(),
    });
    mockFeedItemCreate.mockResolvedValue({});

    await trackActivity({
      userId: 'user-1',
      type: 'streak_milestone',
      action: '7-day streak!',
      createFeedItem: true,
    });

    expect(mockFeedItemCreate).toHaveBeenCalledOnce();
  });

  it('skips FeedItem when user feed prefs disable the category', async () => {
    mockFeedPrefsFind.mockResolvedValue({
      userId: 'user-1',
      goalEvents: false,
      taskEvents: true,
      substepEvents: true,
      costEvents: true,
      noteEvents: true,
      profileEvents: true,
      socialEvents: true,
      streakEvents: true,
    });
    mockFeedItemFindFirst.mockResolvedValue(null);

    await trackActivity({
      userId: 'user-1',
      type: 'goal_updated',
      action: 'Updated',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
  });

  it('does not create FeedItem for unknown activity types', async () => {
    await trackActivity({
      userId: 'user-1',
      type: 'unknown_type_xyz',
      action: 'Something happened',
    });

    expect(mockFeedItemCreate).not.toHaveBeenCalled();
    expect(mockActivityLogCreate).toHaveBeenCalledOnce();
  });
});
