import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGeneratePostContent } from './generatePostContent';
import { prisma } from '@/lib/prisma';

const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;

const GOAL = {
  userId: 'clerk-1',
  title: 'Fitness Journey',
  description: 'Getting fit',
  tasks: [
    { id: 't1', completed: true },
    { id: 't2', completed: true },
    { id: 't3', completed: false },
  ],
};

describe('executeGeneratePostContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGoalFindUnique.mockResolvedValue(GOAL);
  });

  it('generates twitter content with professional tone', async () => {
    const result = await executeGeneratePostContent(
      { goalId: 'goal-1', platform: 'twitter', tone: 'professional' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.platform).toBe('twitter');
    expect(result.tone).toBe('professional');
    expect(result.characterCount).toBe(result.content.length);
  });

  it('generates instagram content', async () => {
    const result = await executeGeneratePostContent(
      { goalId: 'goal-1', platform: 'instagram' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.platform).toBe('instagram');
    // Instagram content includes line breaks
    expect(result.content).toContain('Fitness Journey');
  });

  it('includes hashtags when includeHashtags=true', async () => {
    const result = await executeGeneratePostContent(
      { goalId: 'goal-1', platform: 'twitter', includeHashtags: true },
      'clerk-1'
    );
    expect(result.hashtags.length).toBeGreaterThan(0);
  });

  it('excludes hashtags when includeHashtags=false', async () => {
    const result = await executeGeneratePostContent(
      { goalId: 'goal-1', platform: 'twitter', includeHashtags: false },
      'clerk-1'
    );
    expect(result.hashtags).toHaveLength(0);
  });

  it('calculates correct progress percentage', async () => {
    const result = await executeGeneratePostContent(
      { goalId: 'goal-1', platform: 'twitter', tone: 'professional' },
      'clerk-1'
    );
    // 2 out of 3 tasks = 67%
    expect(result.content).toContain('67%');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeGeneratePostContent({ goalId: 'missing', platform: 'twitter' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when goal belongs to different user', async () => {
    mockGoalFindUnique.mockResolvedValue({ ...GOAL, userId: 'other-user' });
    const result = await executeGeneratePostContent({ goalId: 'goal-1', platform: 'twitter' }, 'clerk-1');
    expect(result.success).toBe(false);
  });
});
