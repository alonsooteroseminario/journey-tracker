import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogger } from '../auditLog';
import { AuditAction } from '@/types/agent';

describe('auditLogger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log goal created', () => {
    auditLogger.logGoalCreated('user-123', 'goal-456', { title: 'Test Goal' });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.GOAL_CREATED);
    expect(logCall.userId).toBe('user-123');
    expect(logCall.resourceId).toBe('goal-456');
    expect(logCall.details).toEqual({ title: 'Test Goal' });
  });

  it('should log goal updated', () => {
    auditLogger.logGoalUpdated('user-123', 'goal-456', { title: 'Updated' });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.GOAL_UPDATED);
  });

  it('should log goal deleted', () => {
    auditLogger.logGoalDeleted('user-123', 'goal-456');

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.GOAL_DELETED);
  });

  it('should log task completed', () => {
    auditLogger.logTaskCompleted('user-123', 'goal-456', 'task-789');

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.TASK_COMPLETED);
    expect(logCall.details).toEqual({ taskId: 'task-789' });
  });

  it('should log task updated', () => {
    auditLogger.logTaskUpdated('user-123', 'goal-456', 'task-789', { completed: true });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.TASK_UPDATED);
  });

  it('should log substep completed', () => {
    auditLogger.logSubstepCompleted('user-123', 'goal-456', 'task-789', 'substep-101');

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.SUBSTEP_COMPLETED);
  });

  it('should log unauthorized access', () => {
    auditLogger.logUnauthorizedAccess('user-123', 'goal-456', 'goal');

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.UNAUTHORIZED_ACCESS);
  });

  it('should log rate limit exceeded', () => {
    auditLogger.logRateLimitExceeded('user-123');

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.action).toBe(AuditAction.RATE_LIMIT_EXCEEDED);
  });

  it('should include timestamp in all logs', () => {
    auditLogger.logGoalCreated('user-123', 'goal-456');

    const logCall = consoleSpy.mock.calls[0][1];
    expect(logCall.timestamp).toBeDefined();
    expect(new Date(logCall.timestamp)).toBeInstanceOf(Date);
  });
});
