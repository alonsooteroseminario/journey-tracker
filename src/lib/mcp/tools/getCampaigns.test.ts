import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      findMany: vi.fn(),
    },
  },
}));

import { executeGetCampaigns } from './getCampaigns';
import { prisma } from '@/lib/prisma';

const mockFindMany = prisma.marketingCampaign.findMany as ReturnType<typeof vi.fn>;

const CAMPAIGN = {
  id: 'camp-1',
  name: 'Spring Campaign',
  description: 'Spring promo',
  platforms: ['twitter', 'instagram'],
  status: 'active',
  targetGoals: ['goal-1'],
  startDate: new Date('2024-03-01'),
  endDate: new Date('2024-03-31'),
  posts: [
    { id: 'post-1', status: 'scheduled', scheduledFor: new Date() },
    { id: 'post-2', status: 'posted', scheduledFor: new Date() },
  ],
};

describe('executeGetCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([CAMPAIGN]);
  });

  it('returns campaigns with post counts', async () => {
    const result = await executeGetCampaigns({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.campaigns).toHaveLength(1);
    expect(result.campaigns[0].name).toBe('Spring Campaign');
    expect(result.campaigns[0].postsCount).toBe(2);
    expect(result.campaigns[0].scheduledPosts).toBe(1);
    expect(result.campaigns[0].postedCount).toBe(1);
  });

  it('filters by status when provided', async () => {
    await executeGetCampaigns({ status: 'active' }, 'clerk-1');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'active' }),
      })
    );
  });

  it('does not apply status filter when not provided', async () => {
    await executeGetCampaigns({}, 'clerk-1');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'clerk-1' },
      })
    );
  });

  it('returns empty array when no campaigns', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await executeGetCampaigns({}, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.campaigns).toHaveLength(0);
    expect(result.count).toBe(0);
  });
});
