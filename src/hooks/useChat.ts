/**
 * Chat hook - Manages chat state and SSE communication
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types/agent';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleChat } from '@/store/slices/chatSlice';
import { goalsApi } from '@/store/slices/goalsSlice';
import { streaksApi } from '@/store/slices/streaksSlice';
import { friendsApi } from '@/store/slices/friendsSlice';

export type ChatStatus = 'idle' | 'thinking' | 'using_tool' | 'generating';

export interface ProcessingEvent {
  toolName: string;
  inputSummary: string;
  resultSummary: string | null;
  success: boolean | null;
}

export interface UseChatReturn {
  messages: Message[];
  status: ChatStatus;
  currentTool: string | null;
  processingLog: ProcessingEvent[];
  sendMessage: (content: string) => Promise<void>;
  cancelRequest: () => void;
  clearMessages: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

// Tools that mutate data — shared between route and client for cache invalidation
const MUTATING_TOOLS = [
  'create-goal', 'update-goal', 'delete-goal', 'create-task',
  'complete-task', 'update-task', 'add-substep', 'complete-substep',
  'update-goal-icon', 'delete-task', 'delete-substep', 'update-profile',
  'remove-friend', 'create-invitation',
];

// Summarise tool input for display: show up to 3 key-value pairs, values truncated
function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '';
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
    .join(', ');
}

// Summarise tool result for display
function summariseResult(data: Record<string, unknown>): string {
  if (data?.message) return String(data.message).slice(0, 60);
  if (data?.error) return `Error: ${data.error}`;
  if (data?.success) return 'OK';
  return 'Done';
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<ProcessingEvent[]>([]);
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.chat.isOpen);

  const toggleOpen = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

  // Ref to accumulate events inside the async loop without stale closures
  const logRef = useRef<ProcessingEvent[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus('idle');
    setCurrentTool(null);
  }, []);

  const clearMessages = useCallback(() => {
    cancelRequest();
    setMessages([]);
    setProcessingLog([]);
    logRef.current = [];
  }, [cancelRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus('thinking');
    setProcessingLog([]);
    logRef.current = [];

    try {
      // Filter out system messages before sending — they are client-only
      const apiMessages = [...messages, userMessage]
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let assistantMessage: Message | null = null;
      const toolsUsed: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue; // Skip malformed SSE lines
          }

          if (data.type === 'status') {
            if (data.status === 'thinking') {
              setStatus('thinking');
              setCurrentTool(null);
            } else if (data.status === 'using_tool') {
              setStatus('using_tool');
              setCurrentTool(data.toolName || null);
              if (data.toolName) toolsUsed.push(data.toolName);
            } else if (data.status === 'generating') {
              setStatus('generating');
              setCurrentTool(null);
            }
          } else if (data.type === 'tool_event') {
            if (data.event === 'input') {
              const event: ProcessingEvent = {
                toolName: data.toolName,
                inputSummary: summariseInput(data.data?.input || {}),
                resultSummary: null,
                success: null,
              };
              logRef.current = [...logRef.current, event];
              setProcessingLog(logRef.current);
            } else if (data.event === 'result') {
              // Find the last entry for this tool that hasn't completed yet
              const idx = [...logRef.current].reverse().findIndex(
                (e) => e.toolName === data.toolName && e.resultSummary === null
              );
              if (idx >= 0) {
                const actualIdx = logRef.current.length - 1 - idx;
                logRef.current = logRef.current.map((e, i) =>
                  i === actualIdx
                    ? {
                        ...e,
                        resultSummary: summariseResult(data.data || {}),
                        success: data.data?.success ?? false,
                      }
                    : e
                );
                setProcessingLog(logRef.current);
              }
            }
          } else if (data.type === 'response') {
            assistantMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.content,
              timestamp: new Date(),
              toolUsed: data.toolUsed,
              toolResult: data.toolResult,
            };
          } else if (data.type === 'error') {
            assistantMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: `Error: ${data.error}`,
              timestamp: new Date(),
            };
          }
        }
      }

      // Build the final message batch: optional system log + assistant response
      const batch: Message[] = [];

      if (logRef.current.length > 0) {
        const logLines = logRef.current.map((e) => {
          const icon = e.success === null ? '⏳' : e.success ? '✓' : '✗';
          const input = e.inputSummary ? ` {${e.inputSummary}}` : '';
          const result = e.resultSummary ? ` → ${e.resultSummary}` : '';
          return `${icon} ${e.toolName}${input}${result}`;
        });

        batch.push({
          id: `system-${Date.now()}`,
          role: 'system',
          content: logLines.join('\n'),
          timestamp: new Date(),
        });
      }

      if (assistantMessage) batch.push(assistantMessage);
      if (batch.length > 0) setMessages((prev) => [...prev, ...batch]);

      // Invalidate RTK Query cache if mutating tools were used
      if (toolsUsed.some((t) => MUTATING_TOOLS.includes(t))) {
        dispatch(goalsApi.util.invalidateTags(['Goal']));
        dispatch(streaksApi.util.invalidateTags(['Streak']));
      }
      if (toolsUsed.some((t) => ['get-friends', 'remove-friend', 'create-invitation'].includes(t))) {
        dispatch(friendsApi.util.invalidateTags(['Friend']));
      }

      setStatus('idle');
      setCurrentTool(null);
      setProcessingLog([]);
      logRef.current = [];
    } catch (error) {
      // Don't show error for intentional cancellation
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('idle');
        setCurrentTool(null);
        return;
      }

      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
      setStatus('idle');
      setCurrentTool(null);
      setProcessingLog([]);
      logRef.current = [];
    }
  }, [messages, dispatch]);

  return {
    messages,
    status,
    currentTool,
    processingLog,
    sendMessage,
    cancelRequest,
    clearMessages,
    isOpen,
    toggleOpen,
  };
}
