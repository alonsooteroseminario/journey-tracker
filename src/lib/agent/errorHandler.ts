/**
 * Centralized error handling for the agent
 */

import { ErrorType, AgentErrorInfo, AgentError } from '@/types/agent';

class AgentErrorHandler {
  /**
   * Convert any error to standardized AgentErrorInfo
   */
  handleError(error: unknown): AgentErrorInfo {
    // Handle AgentError instances
    if (error instanceof AgentError) {
      return {
        type: this.mapCodeToType(error.code),
        message: error.message,
        userMessage: this.formatUserMessage(error),
        recoverable: this.isRecoverable(error.code),
        retryable: this.isRetryable(error.code),
        details: error.details,
      };
    }

    // Handle standard errors
    if (error instanceof Error) {
      const type = this.inferErrorType(error);
      return {
        type,
        message: error.message,
        userMessage: this.formatUserMessageFromType(type, error.message),
        recoverable: type !== ErrorType.AUTHENTICATION,
        retryable: type === ErrorType.NETWORK || type === ErrorType.API_ERROR,
        details: error,
      };
    }

    // Handle unknown errors
    return {
      type: ErrorType.UNKNOWN,
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      retryable: true,
    };
  }

  /**
   * Map error code to ErrorType
   */
  private mapCodeToType(code: string): ErrorType {
    const mapping: Record<string, ErrorType> = {
      'AUTH': ErrorType.AUTHENTICATION,
      'UNAUTHORIZED': ErrorType.AUTHORIZATION,
      'FORBIDDEN': ErrorType.AUTHORIZATION,
      'VALIDATION': ErrorType.VALIDATION,
      'NOT_FOUND': ErrorType.NOT_FOUND,
      'RATE_LIMIT': ErrorType.RATE_LIMIT,
      'API_ERROR': ErrorType.API_ERROR,
      'NETWORK': ErrorType.NETWORK,
    };

    return mapping[code] || ErrorType.UNKNOWN;
  }

  /**
   * Infer error type from Error instance
   */
  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('rate limit')) {
      return ErrorType.RATE_LIMIT;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Format user-friendly error message
   */
  formatUserMessage(error: AgentError): string {
    return this.formatUserMessageFromType(
      this.mapCodeToType(error.code),
      error.message
    );
  }

  /**
   * Format user-friendly message from error type
   */
  private formatUserMessageFromType(type: ErrorType, originalMessage: string): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.AUTHENTICATION]: 'You need to be logged in to do that.',
      [ErrorType.AUTHORIZATION]: 'You don\'t have permission to access that resource.',
      [ErrorType.VALIDATION]: `Invalid input: ${originalMessage}`,
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.API_ERROR]: 'A service error occurred. Please try again.',
      [ErrorType.TOOL_EXECUTION]: `Tool execution failed: ${originalMessage}`,
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
      [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return messages[type] || messages[ErrorType.UNKNOWN];
  }

  /**
   * Determine if error is recoverable
   */
  private isRecoverable(code: string): boolean {
    const unrecoverable = ['AUTH', 'UNAUTHORIZED'];
    return !unrecoverable.includes(code);
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(code: string): boolean {
    const retryable = ['NETWORK', 'API_ERROR', 'RATE_LIMIT'];
    return retryable.includes(code);
  }

  /**
   * Log error with context
   */
  logError(error: unknown, context?: Record<string, any>): void {
    const errorInfo = this.handleError(error);
    console.error('Agent error:', {
      ...errorInfo,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const errorHandler = new AgentErrorHandler();
