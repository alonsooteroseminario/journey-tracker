import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../errorHandler';
import { AgentError, ErrorType } from '@/types/agent';

describe('errorHandler', () => {
  describe('handleError', () => {
    it('should handle AgentError instances', () => {
      const error = new AgentError('Test error', 'AUTH', { detail: 'test' });
      const result = errorHandler.handleError(error);

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.message).toBe('Test error');
      expect(result.userMessage).toContain('logged in');
      expect(result.details).toEqual({ detail: 'test' });
    });

    it('should handle standard Error instances', () => {
      const error = new Error('Validation failed');
      const result = errorHandler.handleError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toBe('Validation failed');
    });

    it('should infer error type from message', () => {
      const tests = [
        { message: 'Unauthorized access', expectedType: ErrorType.AUTHENTICATION },
        { message: 'Forbidden resource', expectedType: ErrorType.AUTHORIZATION },
        { message: 'Invalid input', expectedType: ErrorType.VALIDATION },
        { message: 'Resource not found', expectedType: ErrorType.NOT_FOUND },
        { message: 'Rate limit exceeded', expectedType: ErrorType.RATE_LIMIT },
        { message: 'Network failure', expectedType: ErrorType.NETWORK },
        { message: 'Unknown error', expectedType: ErrorType.UNKNOWN },
      ];

      tests.forEach(({ message, expectedType }) => {
        const error = new Error(message);
        const result = errorHandler.handleError(error);
        expect(result.type).toBe(expectedType);
      });
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const result = errorHandler.handleError(error);

      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.userMessage).toContain('unexpected error');
    });

    it('should mark auth errors as unrecoverable', () => {
      const error = new AgentError('Auth failed', 'AUTH');
      const result = errorHandler.handleError(error);

      expect(result.recoverable).toBe(false);
    });

    it('should mark network errors as retryable', () => {
      const error = new AgentError('Network timeout', 'NETWORK');
      const result = errorHandler.handleError(error);

      expect(result.retryable).toBe(true);
    });
  });

  describe('formatUserMessage', () => {
    it('should format user-friendly messages for each error type', () => {
      const errorTypes = [
        { code: 'AUTH', expectedContains: 'logged in' },
        { code: 'FORBIDDEN', expectedContains: 'permission' },
        { code: 'VALIDATION', expectedContains: 'Invalid' },
        { code: 'NOT_FOUND', expectedContains: 'not found' },
        { code: 'RATE_LIMIT', expectedContains: 'Too many' },
        { code: 'NETWORK', expectedContains: 'Network' },
      ];

      errorTypes.forEach(({ code, expectedContains }) => {
        const error = new AgentError('Test', code);
        const result = errorHandler.handleError(error);
        expect(result.userMessage.toLowerCase()).toContain(expectedContains.toLowerCase());
      });
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler.logError(new Error('Test error'), { userId: 'test-123' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
