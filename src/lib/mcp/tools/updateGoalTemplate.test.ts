// src/lib/mcp/tools/updateGoalTemplate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateGoalTemplate } from './updateGoalTemplate';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goalTemplate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockTemplateFindUnique = prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>;
const mockTemplateUpdate = prisma.goalTemplate.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const TEMPLATE = { id: 'tpl-1', title: 'Fitness Plan', authorId: USER.id, difficulty: 'intermediate' };

describe('executeUpdateGoalTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockTemplateFindUnique.mockResolvedValue(TEMPLATE);
    mockTemplateUpdate.mockResolvedValue({ ...TEMPLATE, difficulty: 'advanced', title: 'Fitness Plan' });
  });

  it('updates template fields successfully', async () => {
    const result = await executeUpdateGoalTemplate(
      { templateId: 'tpl-1', difficulty: 'advanced', tips: 'Start slow' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(mockTemplateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tpl-1' },
        data: expect.objectContaining({ difficulty: 'advanced', tips: 'Start slow' }),
      })
    );
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateGoalTemplate({ templateId: 'tpl-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeUpdateGoalTemplate({ templateId: 'tpl-1', tips: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when template not found', async () => {
    mockTemplateFindUnique.mockResolvedValue(null);
    const result = await executeUpdateGoalTemplate({ templateId: 'missing', tips: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('returns error when user is not the author', async () => {
    mockTemplateFindUnique.mockResolvedValue({ ...TEMPLATE, authorId: 'other-user' });
    const result = await executeUpdateGoalTemplate({ templateId: 'tpl-1', tips: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('returns error when no fields provided', async () => {
    const result = await executeUpdateGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
    expect(mockTemplateUpdate).not.toHaveBeenCalled();
  });
});
