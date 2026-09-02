/**
 * Agent chat API route
 * POST /api/agent/chat - Chat with AI agent (SSE streaming)
 * GET /api/agent/chat - Get agent status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { getMCPServer } from '@/lib/mcp/server';
import { securityGuard } from '@/lib/agent/security';
import { errorHandler } from '@/lib/agent/errorHandler';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { Message, ChatRequest } from '@/types/agent';
import { logAnthropicUsage } from '@/lib/cost-tracking/anthropic';
import { getUserAgentKey } from '@/lib/agent/getUserAgentKey';
import { AGENT_MODEL } from '@/lib/agent/model';
import { trimMessages } from '@/lib/agent/trimMessages';

// Lazy Anthropic client — accepts a user-supplied key; falls back to env for admin routes.
function getAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

const AGENT_MAX_TOKENS = parseInt(process.env.AGENT_MAX_TOKENS || '4096', 10);
// No `temperature`: it is deprecated on current Claude models and passing it
// at all returns 400 `invalid_request_error`.

// System prompt for the agent
const SYSTEM_PROMPT = `You are a helpful assistant for Journey Tracker, a goal-tracking application.
You help users manage their goals, tasks, streaks, and track their progress.

You can:
- Create, view, update, and delete goals
- Manage tasks and substeps within goals
- Check streak data and activity history
- Generate progress reports and analytics
- View friends and their progress

Always be encouraging and supportive. When users complete tasks, celebrate their progress.
When they ask about their streaks, motivate them to keep going.
Use the available tools to access and modify user data. Never make up data.
If you need a goal ID or task ID and the user hasn't specified one, ask them or use the
get-goals tool to find the right one.`;

// Maximum iterations for tool use loop.  With parallel tool execution each
// iteration can complete multiple independent calls simultaneously, so the
// effective throughput is much higher than the raw count.  Bulk operations
// still consume one iteration per Claude round-trip.
const MAX_TOOL_ITERATIONS = 40;

/**
 * GET handler - Return agent status
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const server = getMCPServer();
    const tools = server.getAllTools();

    return NextResponse.json({
      status: 'online',
      model: AGENT_MODEL,
      toolCount: tools.length,
      tools: tools.map((t) => t.name),
    });
  } catch (error) {
    console.error('GET /api/agent/chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Chat with agent
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require user-supplied API key (BYOK gate)
    const agentApiKey = await getUserAgentKey(userId);
    if (!agentApiKey) {
      return NextResponse.json(
        {
          error: 'NO_AGENT_KEY',
          message: 'Set your Anthropic API key in Settings to chat with the agent.',
          settingsUrl: '/settings/ai-key',
        },
        { status: 403 },
      );
    }

    // Rate limit check
    if (!securityGuard.checkRateLimit(userId)) {
      auditLogger.logRateLimitExceeded(userId);
      const rateLimitHeaders = securityGuard.getRateLimitHeaders(userId);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Parse request
    const body: ChatRequest = await req.json();
    const { messages, stream = true } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Increment message count
    conversationStore.incrementMessages(userId);

    // Get MCP server and tools
    const server = getMCPServer();
    const tools = server.getAllTools();

    // Convert messages to Anthropic format (filter out system messages - they're client-only)
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // If streaming, return SSE response
    if (stream) {
      return createSSEResponse(anthropicMessages, tools, userId, req.signal, agentApiKey);
    }

    // Non-streaming response
    const response = await runAgentLoop(anthropicMessages, tools, userId, undefined, undefined, undefined, agentApiKey);

    return NextResponse.json({
      role: 'assistant',
      content: response.content,
      toolUsed: response.toolUsed,
      toolResult: response.toolResult,
    });
  } catch (error) {
    console.error('POST /api/agent/chat error:', error);
    const errorInfo = errorHandler.handleError(error);

    return NextResponse.json(
      { error: errorInfo.userMessage },
      { status: 500 }
    );
  }
}

/**
 * Create Server-Sent Events response
 */
function createSSEResponse(
  messages: Anthropic.Messages.MessageParam[],
  tools: unknown[],
  userId: string,
  signal: AbortSignal,
  apiKey: string
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send periodic keepalive comments to prevent connection timeouts
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 15000);

      try {
        // Send thinking status
        sendSSE(controller, encoder, { type: 'status', status: 'thinking' });

        // Run agent loop with abort signal
        const response = await runAgentLoop(messages, tools, userId, signal,
          (status, toolName) => {
            sendSSE(controller, encoder, { type: 'status', status, toolName });
          },
          (event, toolName, data) => {
            sendSSE(controller, encoder, { type: 'tool_event', event, toolName, data });
          },
          apiKey
        );

        // Send final response
        sendSSE(controller, encoder, {
          type: 'response',
          role: 'assistant',
          content: response.content,
          toolUsed: response.toolUsed,
          toolResult: response.toolResult,
        });

        clearInterval(keepaliveInterval);
        controller.close();
      } catch (error) {
        clearInterval(keepaliveInterval);

        if (signal.aborted) {
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        console.error('SSE stream error:', error);
        const errorInfo = errorHandler.handleError(error);

        sendSSE(controller, encoder, {
          type: 'error',
          error: errorInfo.userMessage,
        });

        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Send SSE message. Silently no-ops if the client has already closed the stream.
 */
function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: Record<string, unknown>
): void {
  try {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  } catch {
    // Client disconnected — controller already closed, nothing to do.
  }
}

// Tools that mutate data — writes to the same goalId must be sequential.
const WRITE_TOOLS = new Set([
  'create-goal', 'update-goal', 'delete-goal', 'create-task',
  'complete-task', 'update-task', 'add-substep', 'complete-substep',
  'update-goal-icon', 'delete-task', 'delete-substep', 'update-profile',
  'remove-friend', 'create-invitation',
]);

/**
 * Partition tool-use blocks into groups that can run in parallel.
 * – Read-only tools share one group (all run concurrently).
 * – Write tools are grouped by goalId; blocks within each group run sequentially
 *   to preserve read-modify-write consistency, but groups for different goalIds
 *   run concurrently with each other.
 * – Write tools with no goalId each get their own singleton group.
 */
function partitionForExecution(
  blocks: Anthropic.Messages.ToolUseBlock[]
): Anthropic.Messages.ToolUseBlock[][] {
  const readOnly: Anthropic.Messages.ToolUseBlock[] = [];
  const writeByGoal = new Map<string, Anthropic.Messages.ToolUseBlock[]>();
  const writeNoGoal: Anthropic.Messages.ToolUseBlock[] = [];

  for (const block of blocks) {
    if (!WRITE_TOOLS.has(block.name)) {
      readOnly.push(block);
    } else {
      const input = block.input as Record<string, unknown>;
      const goalId = (input.goalId ?? input.goal_id ?? null) as string | null;
      if (goalId) {
        if (!writeByGoal.has(goalId)) writeByGoal.set(goalId, []);
        writeByGoal.get(goalId)!.push(block);
      } else {
        writeNoGoal.push(block);
      }
    }
  }

  const groups: Anthropic.Messages.ToolUseBlock[][] = [];
  if (readOnly.length > 0) groups.push(readOnly);
  for (const group of writeByGoal.values()) groups.push(group);
  for (const block of writeNoGoal) groups.push([block]);
  return groups;
}

/**
 * Run the agent loop with tool execution
 */
async function runAgentLoop(
  messages: Anthropic.Messages.MessageParam[],
  tools: unknown[],
  userId: string,
  signal?: AbortSignal,
  onStatus?: (status: string, toolName?: string) => void,
  onToolEvent?: (event: 'input' | 'result', toolName: string, data: Record<string, unknown>) => void,
  apiKey?: string
): Promise<{ content: string; toolUsed?: string; toolResult?: unknown }> {
  const server = getMCPServer();
  // eslint-disable-next-line prefer-const
  let currentMessages = [...messages];
  let iterations = 0;
  let lastToolUsed: string | undefined;
  let lastToolResult: unknown;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    // Check if client disconnected
    if (signal?.aborted) {
      throw new Error('Request aborted by client');
    }

    // Trim intermediate tool messages to prevent context bloat during bulk
    // operations.  Keeps the original user message (index 0) plus the most
    // recent round-trips, snapping the cut so it never orphans a tool_result.
    currentMessages = trimMessages(currentMessages);

    // Call Claude — use user-supplied key or env fallback (admin routes only)
    const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    const response = await getAnthropicClient(resolvedKey).messages.create({
      model: AGENT_MODEL,
      max_tokens: AGENT_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: currentMessages,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any[],
    });

    // Fire-and-forget cost logging — never blocks the agent loop
    logAnthropicUsage({
      clerkId: userId,
      model: AGENT_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      date: new Date(),
    }).catch((err) => console.error('Cost logging error:', err));

    // Check stop reason
    if (response.stop_reason === 'end_turn') {
      // Extract text content
      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      return { content, toolUsed: lastToolUsed, toolResult: lastToolResult };
    }

    // Extract tool_use blocks — used by both 'tool_use' and 'max_tokens'
    // paths, because Claude can emit complete tool_use blocks even when
    // generation is cut short by the token limit.
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
    );

    if (response.stop_reason === 'tool_use' || (response.stop_reason === 'max_tokens' && toolUseBlocks.length > 0)) {
      if (toolUseBlocks.length === 0) {
        throw new Error('Tool use block not found in response');
      }

      // Partition into conflict-free groups and execute groups in parallel.
      // Within each group tools run sequentially to protect read-modify-write
      // consistency on the same goalId.  Groups for different goalIds (and all
      // read-only tools) run concurrently.
      const resultMap = new Map<string, { tool_use_id: string; content: string }>();
      const groups = partitionForExecution(toolUseBlocks);

      await Promise.all(groups.map(async (group) => {
        for (const block of group) {
          const toolName = block.name;
          const toolInput = block.input as Record<string, unknown>;

          if (onStatus) onStatus('using_tool', toolName);

          const executor = server.getToolExecutor(toolName);

          if (!executor) {
            if (onToolEvent) onToolEvent('input', toolName, { input: toolInput });
            if (onToolEvent) onToolEvent('result', toolName, { success: false, error: 'Tool not found' });
            resultMap.set(block.id, {
              tool_use_id: block.id,
              content: JSON.stringify({ success: false, error: 'Tool not found', message: `No executor for: ${toolName}` }),
            });
            continue;
          }

          if (onToolEvent) onToolEvent('input', toolName, { input: toolInput });
          const toolResult = await executor(toolInput, userId);
          if (onToolEvent) onToolEvent('result', toolName, { success: toolResult.success, message: toolResult.message, error: toolResult.error });
          lastToolResult = toolResult;

          if (toolResult.success && toolResult.data) {
            if (toolName === 'get-goal-by-id' || toolName === 'create-goal') {
              const data = toolResult.data as Record<string, unknown>;
              if (data.id) {
                conversationStore.setLastGoal(userId, data.id as string);
              }
            }
          }

          resultMap.set(block.id, {
            tool_use_id: block.id,
            content: JSON.stringify(toolResult),
          });
        }
      }));

      // Preserve original block order for the API response
      lastToolUsed = toolUseBlocks[toolUseBlocks.length - 1].name;
      const toolResults = toolUseBlocks.map((block) => resultMap.get(block.id)!);

      // Add assistant message with all tool_use blocks
      currentMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Add all tool_results in a single user message
      currentMessages.push({
        role: 'user',
        content: toolResults.map((r) => ({
          type: 'tool_result' as const,
          tool_use_id: r.tool_use_id,
          content: r.content,
        })),
      });

      if (onStatus) {
        onStatus('thinking');
      }

      continue;
    }

    // Handle max_tokens with no actionable tool_use blocks — return what we have
    if (response.stop_reason === 'max_tokens') {
      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      return {
        content: content + '\n\n(Response truncated due to length)',
        toolUsed: lastToolUsed,
        toolResult: lastToolResult,
      };
    }

    // Unexpected stop reason
    throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
  }

  throw new Error('Max tool iterations exceeded');
}

// Vercel serverless timeout — bulk tool operations (e.g. adding substeps to many tasks)
// can take well over 60s due to sequential Claude API round-trips.
export const maxDuration = 120;
