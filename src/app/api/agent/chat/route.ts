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

// Lazy Anthropic client — avoids module-level instantiation so tests can mock the constructor
function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
}

const AGENT_MODEL = process.env.AGENT_MODEL || 'claude-sonnet-4-20250514';
const AGENT_MAX_TOKENS = parseInt(process.env.AGENT_MAX_TOKENS || '4096', 10);
const AGENT_TEMPERATURE = parseFloat(process.env.AGENT_TEMPERATURE || '0.7');

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

// Maximum iterations for tool use loop.
// Bulk operations (e.g. adding substeps to every task) can consume many iterations:
// 2 setup calls (get-goals + get-goal-by-id) + 1 batch per task = N+2.
const MAX_TOOL_ITERATIONS = 25;

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

    // Rate limit check
    if (!securityGuard.checkRateLimit(userId)) {
      auditLogger.logRateLimitExceeded(userId);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
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

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // If streaming, return SSE response
    if (stream) {
      return createSSEResponse(anthropicMessages, tools, userId);
    }

    // Non-streaming response
    const response = await runAgentLoop(anthropicMessages, tools, userId);

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
  tools: any[],
  userId: string
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send thinking status
        sendSSE(controller, encoder, { type: 'status', status: 'thinking' });

        // Run agent loop
        const response = await runAgentLoop(messages, tools, userId, (status, toolName) => {
          sendSSE(controller, encoder, { type: 'status', status, toolName });
        });

        // Send final response
        sendSSE(controller, encoder, {
          type: 'response',
          role: 'assistant',
          content: response.content,
          toolUsed: response.toolUsed,
          toolResult: response.toolResult,
        });

        controller.close();
      } catch (error) {
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
  data: any
): void {
  try {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  } catch {
    // Client disconnected — controller already closed, nothing to do.
  }
}

/**
 * Run the agent loop with tool execution
 */
async function runAgentLoop(
  messages: Anthropic.Messages.MessageParam[],
  tools: any[],
  userId: string,
  onStatus?: (status: string, toolName?: string) => void
): Promise<{ content: string; toolUsed?: string; toolResult?: any }> {
  const server = getMCPServer();
  // eslint-disable-next-line prefer-const
  let currentMessages = [...messages];
  let iterations = 0;
  let lastToolUsed: string | undefined;
  let lastToolResult: any;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    // Call Claude
    const response = await getAnthropicClient().messages.create({
      model: AGENT_MODEL,
      max_tokens: AGENT_MAX_TOKENS,
      temperature: AGENT_TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: currentMessages,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
    });

    // Check stop reason
    if (response.stop_reason === 'end_turn') {
      // Extract text content
      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      return { content, toolUsed: lastToolUsed, toolResult: lastToolResult };
    }

    if (response.stop_reason === 'tool_use') {
      // Claude may return multiple tool_use blocks (parallel calls).
      // ALL must get a tool_result in the next message or the API returns 400.
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) {
        throw new Error('Tool use block not found in response');
      }

      // Execute tools sequentially — many tools do read-modify-write on the
      // same goal row, so parallel execution would cause last-write-wins data loss.
      const toolResults: Array<{ tool_use_id: string; content: string }> = [];

      for (const block of toolUseBlocks) {
        const toolName = block.name;
        const toolInput = block.input as Record<string, any>;

        lastToolUsed = toolName;

        if (onStatus) {
          onStatus('using_tool', toolName);
        }

        const executor = server.getToolExecutor(toolName);

        if (!executor) {
          toolResults.push({
            tool_use_id: block.id,
            content: JSON.stringify({ success: false, error: 'Tool not found', message: `No executor for: ${toolName}` }),
          });
          continue;
        }

        const toolResult = await executor(toolInput, userId);
        lastToolResult = toolResult;

        // Update conversation context based on tool result
        if (toolResult.success && toolResult.data) {
          if (toolName === 'get-goal-by-id' || toolName === 'create-goal') {
            if (toolResult.data.id) {
              conversationStore.setLastGoal(userId, toolResult.data.id);
            }
          }
        }

        toolResults.push({
          tool_use_id: block.id,
          content: JSON.stringify(toolResult),
        });
      }

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

    // Handle max_tokens stop reason
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
