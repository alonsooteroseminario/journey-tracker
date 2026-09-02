/**
 * Admin agent chat API route
 * POST /api/admin/agent/chat - Chat with admin AI agent (SSE streaming)
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminMCPServer } from "@/lib/mcp/adminServer";
import { getAdminSystemPrompt } from "@/lib/admin/agent/systemPrompt";
import { requireAdmin } from "@/lib/admin/auth";
import { securityGuard } from "@/lib/agent/security";
import { errorHandler } from "@/lib/agent/errorHandler";
import { auditLogger } from "@/lib/agent/auditLog";
import { Message, ChatRequest } from "@/types/agent";
import { AGENT_MODEL } from "@/lib/agent/model";
import { trimMessages } from "@/lib/agent/trimMessages";

// Lazy Anthropic client
function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  });
}

const AGENT_MAX_TOKENS = parseInt(process.env.AGENT_MAX_TOKENS || "4096", 10);
// No `temperature`: deprecated on current Claude models, returns 400 if sent.
const MAX_TOOL_ITERATIONS = 25;

/**
 * POST handler - Chat with admin agent
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate as admin
    const user = await requireAdmin();
    const userId = user.id;

    // Rate limit check
    if (!securityGuard.checkRateLimit(userId)) {
      auditLogger.logRateLimitExceeded(userId);
      const rateLimitHeaders = securityGuard.getRateLimitHeaders(userId);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Parse request
    const body: ChatRequest = await req.json();
    const { messages, stream = true } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get admin MCP server and tools
    const server = getAdminMCPServer();
    const tools = server.getAllTools();

    // Convert messages to Anthropic format (filter out system messages)
    const anthropicMessages: Anthropic.Messages.MessageParam[] = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // If streaming, return SSE response
    if (stream) {
      return createSSEResponse(anthropicMessages, tools, userId, req.signal);
    }

    // Non-streaming response
    const response = await runAdminAgentLoop(anthropicMessages, tools, userId);

    return NextResponse.json({
      role: "assistant",
      content: response.content,
      toolUsed: response.toolUsed,
      toolResult: response.toolResult,
    });
  } catch (error) {
    console.error("POST /api/admin/agent/chat error:", error);
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
  signal: AbortSignal
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send periodic keepalive comments to prevent connection timeouts
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 15000);

      try {
        // Send thinking status
        sendSSE(controller, encoder, { type: "status", status: "thinking" });

        // Run agent loop with abort signal
        const response = await runAdminAgentLoop(
          messages,
          tools,
          userId,
          signal,
          (status, toolName) => {
            sendSSE(controller, encoder, { type: "status", status, toolName });
          },
          (event, toolName, data) => {
            sendSSE(controller, encoder, {
              type: "tool_event",
              event,
              toolName,
              data,
            });
          }
        );

        // Send final response
        sendSSE(controller, encoder, {
          type: "response",
          role: "assistant",
          content: response.content,
          toolUsed: response.toolUsed,
          toolResult: response.toolResult,
        });

        clearInterval(keepaliveInterval);
        controller.close();
      } catch (error) {
        clearInterval(keepaliveInterval);

        if (signal.aborted) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          return;
        }

        console.error("Admin SSE stream error:", error);
        const errorInfo = errorHandler.handleError(error);

        sendSSE(controller, encoder, {
          type: "error",
          error: errorInfo.userMessage,
        });

        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Send SSE message
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
    // Client disconnected
  }
}

/**
 * Run the admin agent loop with tool execution
 * Admin tools run sequentially (no parallel execution needed)
 */
async function runAdminAgentLoop(
  messages: Anthropic.Messages.MessageParam[],
  tools: unknown[],
  userId: string,
  signal?: AbortSignal,
  onStatus?: (status: string, toolName?: string) => void,
  onToolEvent?: (
    event: "input" | "result",
    toolName: string,
    data: Record<string, unknown>
  ) => void
): Promise<{ content: string; toolUsed?: string; toolResult?: unknown }> {
  const server = getAdminMCPServer();
  let currentMessages = [...messages];
  let iterations = 0;
  let lastToolUsed: string | undefined;
  let lastToolResult: unknown;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    // Check if client disconnected
    if (signal?.aborted) {
      throw new Error("Request aborted by client");
    }

    // Trim messages to prevent context bloat, snapping the cut so it never
    // orphans a tool_result (the API 400s on that shape).
    currentMessages = trimMessages(currentMessages);

    // Call Claude with admin system prompt
    const response = await getAnthropicClient().messages.create({
      model: AGENT_MODEL,
      max_tokens: AGENT_MAX_TOKENS,
      system: getAdminSystemPrompt(),
      messages: currentMessages,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any[],
    });

    // Check stop reason
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((block) => block.type === "text");
      const content = textBlock && "text" in textBlock ? textBlock.text : "";

      return { content, toolUsed: lastToolUsed, toolResult: lastToolResult };
    }

    // Extract tool_use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use"
    );

    if (
      response.stop_reason === "tool_use" ||
      (response.stop_reason === "max_tokens" && toolUseBlocks.length > 0)
    ) {
      if (toolUseBlocks.length === 0) {
        throw new Error("Tool use block not found in response");
      }

      // Execute tools sequentially (admin tools are simpler, no parallel needed)
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        const toolName = block.name;
        const toolInput = block.input as Record<string, unknown>;

        if (onStatus) onStatus("using_tool", toolName);

        const executor = server.getToolExecutor(toolName);

        if (!executor) {
          if (onToolEvent)
            onToolEvent("input", toolName, { input: toolInput });
          if (onToolEvent)
            onToolEvent("result", toolName, {
              success: false,
              error: "Tool not found",
            });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
              success: false,
              error: "Tool not found",
              message: `No executor for: ${toolName}`,
            }),
          });
          continue;
        }

        if (onToolEvent) onToolEvent("input", toolName, { input: toolInput });
        const toolResult = await executor(toolInput, userId);
        if (onToolEvent)
          onToolEvent("result", toolName, {
            success: toolResult.success,
            message: toolResult.message,
            error: toolResult.error,
          });
        lastToolResult = toolResult;
        lastToolUsed = toolName;

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Add assistant message with tool_use blocks
      currentMessages.push({
        role: "assistant",
        content: response.content,
      });

      // Add tool results
      currentMessages.push({
        role: "user",
        content: toolResults,
      });

      continue;
    }

    // Handle max_tokens without tool use
    if (response.stop_reason === "max_tokens") {
      const textBlock = response.content.find((block) => block.type === "text");
      const content = textBlock && "text" in textBlock ? textBlock.text : "";

      return {
        content:
          content +
          "\n\n[Response truncated due to length. Please continue or rephrase.]",
        toolUsed: lastToolUsed,
        toolResult: lastToolResult,
      };
    }

    // Unknown stop reason
    throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
  }

  throw new Error(
    `Agent loop exceeded maximum iterations (${MAX_TOOL_ITERATIONS})`
  );
}
