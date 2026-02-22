import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeleteGoalTemplate } from './deleteGoalTemplate';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goalTemplate: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/prisma';

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockTemplateFindUnique = (prisma as any).goalTemplate.findUnique as ReturnType<typeof vi.fn>;
const mockTemplateDelete = (prisma as any).goalTemplate.delete as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const TEMPLATE = { id: 'tpl-1', title: 'Fitness Plan', icon: '💪', authorId: USER.id };

describe('executeDeleteGoalTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockTemplateFindUnique.mockResolvedValue(TEMPLATE);
    mockTemplateDelete.mockResolvedValue({});
  });

  it('deletes own template successfully', async () => {
    const result = await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Fitness Plan');
    expect(mockTemplateDelete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
  });

  it('returns error when userId missing', async () => {
    const result = await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when template not found', async () => {
    mockTemplateFindUnique.mockResolvedValue(null);
    const result = await executeDeleteGoalTemplate({ templateId: 'missing' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('returns error when user is not the author', async () => {
    mockTemplateFindUnique.mockResolvedValue({ ...TEMPLATE, authorId: 'other-user' });
    const result = await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('does not delete when template belongs to another user', async () => {
    mockTemplateFindUnique.mockResolvedValue({ ...TEMPLATE, authorId: 'other-user' });
    await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(mockTemplateDelete).not.toHaveBeenCalled();
  });

  it('includes template title in success message', async () => {
    const result = await executeDeleteGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Fitness Plan/);
  });
});
