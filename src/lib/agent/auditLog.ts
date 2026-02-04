/**
 * Audit logging for agent actions
 */

import { AuditAction, AuditEntry } from '@/types/agent';

class AuditLogger {
  /**
   * Log an audit entry
   */
  private log(entry: AuditEntry): void {
    // TODO: Persist to database or external logging service
    // For now, just console log
    console.log('AUDIT:', {
      action: entry.action,
      userId: entry.userId,
      resourceId: entry.resourceId,
      timestamp: entry.timestamp.toISOString(),
      details: entry.details,
    });
  }

  /**
   * Log goal created
   */
  logGoalCreated(userId: string, goalId: string, details?: Record<string, any>): void {
    this.log({
      action: AuditAction.GOAL_CREATED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
      details,
    });
  }

  /**
   * Log goal updated
   */
  logGoalUpdated(userId: string, goalId: string, details?: Record<string, any>): void {
    this.log({
      action: AuditAction.GOAL_UPDATED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
      details,
    });
  }

  /**
   * Log goal deleted
   */
  logGoalDeleted(userId: string, goalId: string): void {
    this.log({
      action: AuditAction.GOAL_DELETED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
    });
  }

  /**
   * Log task completed
   */
  logTaskCompleted(userId: string, goalId: string, taskId: string): void {
    this.log({
      action: AuditAction.TASK_COMPLETED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
      details: { taskId },
    });
  }

  /**
   * Log task updated
   */
  logTaskUpdated(userId: string, goalId: string, taskId: string, details?: Record<string, any>): void {
    this.log({
      action: AuditAction.TASK_UPDATED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
      details: { taskId, ...details },
    });
  }

  /**
   * Log substep completed
   */
  logSubstepCompleted(userId: string, goalId: string, taskId: string, substepId: string): void {
    this.log({
      action: AuditAction.SUBSTEP_COMPLETED,
      userId,
      resourceId: goalId,
      timestamp: new Date(),
      details: { taskId, substepId },
    });
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(userId: string, resourceId: string, resourceType: string): void {
    this.log({
      action: AuditAction.UNAUTHORIZED_ACCESS,
      userId,
      resourceId,
      timestamp: new Date(),
      details: { resourceType },
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(userId: string): void {
    this.log({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Log profile updated
   */
  logProfileUpdated(userId: string, details?: Record<string, any>): void {
    this.log({
      action: AuditAction.PROFILE_UPDATED,
      userId,
      timestamp: new Date(),
      details,
    });
  }

  /**
   * Log friend removed
   */
  logFriendRemoved(userId: string, friendId: string, details?: Record<string, any>): void {
    this.log({
      action: AuditAction.FRIEND_REMOVED,
      userId,
      resourceId: friendId,
      timestamp: new Date(),
      details,
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
