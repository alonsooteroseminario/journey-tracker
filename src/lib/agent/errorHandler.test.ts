import { describe, it, expect } from 'vitest';
import { errorHandler } from './errorHandler';
import { ErrorType } from '@/types/agent';
import { AGENT_MODEL } from './model';

/**
 * Regression: a retired model made the Anthropic API return
 *   404 {"type":"error","error":{"type":"not_found_error","message":"model: ..."}}
 * The keyword check looked for "not found" (space) but the payload says
 * "not_found_error" (underscore), so it fell through to UNKNOWN and the chat
 * showed "An unexpected error occurred" for what was really a dead model.
 */
describe('errorHandler — Anthropic snake_case error slugs', () => {
  const anthropicError = (status: number, type: string, message: string) =>
    new Error(`${status} {"type":"error","error":{"type":"${type}","message":"${message}"}}`);

  it('classifies not_found_error as NOT_FOUND, not UNKNOWN', () => {
    const info = errorHandler.handleError(
      anthropicError(404, 'not_found_error', 'model: claude-sonnet-4-20250514'),
    );
    expect(info.type).toBe(ErrorType.NOT_FOUND);
    expect(info.userMessage).not.toBe('An unexpected error occurred. Please try again.');
  });

  it('classifies rate_limit_error as RATE_LIMIT, not UNKNOWN', () => {
    const info = errorHandler.handleError(
      anthropicError(429, 'rate_limit_error', 'Number of requests has exceeded your limit'),
    );
    expect(info.type).toBe(ErrorType.RATE_LIMIT);
    expect(info.userMessage).toBe('Too many requests. Please wait a moment and try again.');
    expect(info.retryable).toBe(true);
  });

  it('classifies authentication_error as AUTHENTICATION', () => {
    const info = errorHandler.handleError(
      anthropicError(401, 'authentication_error', 'invalid x-api-key'),
    );
    expect(info.type).toBe(ErrorType.AUTHENTICATION);
  });

  it('classifies invalid_request_error as VALIDATION', () => {
    const info = errorHandler.handleError(
      anthropicError(400, 'invalid_request_error', 'Your credit balance is too low'),
    );
    expect(info.type).toBe(ErrorType.VALIDATION);
  });

  it('still returns UNKNOWN for genuinely unrecognized errors', () => {
    const info = errorHandler.handleError(new Error('something weird happened'));
    expect(info.type).toBe(ErrorType.UNKNOWN);
  });
});

describe('AGENT_MODEL', () => {
  it('is not the retired claude-sonnet-4-20250514', () => {
    expect(AGENT_MODEL).not.toBe('claude-sonnet-4-20250514');
  });
});
