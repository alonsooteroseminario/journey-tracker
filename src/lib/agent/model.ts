/**
 * Single source of truth for the Claude model the agent runs on.
 *
 * This was previously a `process.env.AGENT_MODEL || '<literal>'` default
 * duplicated across three call sites. When `claude-sonnet-4-20250514` was
 * retired, all three broke at once and the API returned a 404 the error
 * handler could not classify. Keep it in one place.
 *
 * Verify a candidate is still served before changing it:
 *   curl -s https://api.anthropic.com/v1/models \
 *     -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"
 */
export const AGENT_MODEL = process.env.AGENT_MODEL || 'claude-sonnet-5';
