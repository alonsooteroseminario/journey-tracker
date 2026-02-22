import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateCampaign } from './createCampaign';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    marketingCampaign: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
const mockCreate = prisma.marketingCampaign.create as ReturnType<typeof vi.fn>;

const CAMPAIGN_RESPONSE = {
  id: 'camp-1',
  name: 'Spring Push',
  platforms: ['twitter'],
  status: 'draft',
};

describe('executeCreateCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(CAMPAIGN_RESPONSE);
  });

  it('creates campaign successfully', async () => {
    const result = await executeCreateCampaign(
      { name: 'Spring Push', platforms: ['twitter'], description: 'Spring promo' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.campaign.id).toBe('camp-1');
    expect(result.campaign.status).toBe('draft');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'clerk-1',
          name: 'Spring Push',
          platforms: ['twitter'],
          status: 'draft',
        }),
      })
    );
  });

  it('defaults targetGoals to empty array when not provided', async () => {
    await executeCreateCampaign({ name: 'Test', platforms: ['instagram'] }, 'clerk-1');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetGoals: [] }),
      })
    );
  });

  it('parses date strings to Date objects', async () => {
    await executeCreateCampaign(
      { name: 'Test', platforms: ['twitter'], startDate: '2024-03-01', endDate: '2024-03-31' },
      'clerk-1'
    );
    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.startDate).toBeInstanceOf(Date);
    expect(callData.endDate).toBeInstanceOf(Date);
  });

  it('sets null dates when not provided', async () => {
    await executeCreateCampaign({ name: 'Test', platforms: ['twitter'] }, 'clerk-1');
    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.startDate).toBeNull();
    expect(callData.endDate).toBeNull();
  });

  it('handles database errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('DB error'));
    const result = await executeCreateCampaign({ name: 'Test', platforms: ['twitter'] }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});
