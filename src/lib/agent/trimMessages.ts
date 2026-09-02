import type Anthropic from '@anthropic-ai/sdk';

/**
 * True if this message carries tool_result blocks, i.e. it is the second half
 * of an assistant(tool_use) → user(tool_result) pair and cannot lead a request.
 */
function carriesToolResult(msg: Anthropic.Messages.MessageParam): boolean {
  return (
    msg.role === 'user' &&
    Array.isArray(msg.content) &&
    msg.content.some((b) => typeof b === 'object' && b !== null && b.type === 'tool_result')
  );
}

/**
 * Trim conversation history during long tool-use loops, without orphaning a
 * tool_result.
 *
 * The API rejects a user message containing tool_result blocks unless the
 * immediately preceding assistant message carries the matching tool_use blocks
 * (verified: that shape returns 400, while consecutive user messages are fine).
 * A blind `slice(-keep)` can land mid-pair, so walk the start index forward
 * until it points at a message that is safe to lead with.
 *
 * Always keeps messages[0] — the user's original request, which carries the
 * intent the rest of the loop is serving.
 */
export function trimMessages(
  messages: Anthropic.Messages.MessageParam[],
  keep = 12,
): Anthropic.Messages.MessageParam[] {
  if (messages.length <= keep + 2) return messages;

  let start = messages.length - keep;
  while (start < messages.length && carriesToolResult(messages[start])) {
    start++;
  }

  return [messages[0], ...messages.slice(start)];
}
