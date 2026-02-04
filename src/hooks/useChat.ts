/**
 * Chat hook - Manages chat state and SSE communication
 */

import { useState, useCallback } from 'react';
import { Message } from '@/types/agent';
import { useAppDispatch } from '@/store/hooks';
import { goalsApi } from '@/store/slices/goalsSlice';
import { streaksApi } from '@/store/slices/streaksSlice';
import { friendsApi } from '@/store/slices/friendsSlice';

export type ChatStatus = 'idle' | 'thinking' | 'using_tool' | 'generating';

export interface UseChatReturn {
  messages: Message[];
  status: ChatStatus;
  currentTool: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setCurrentTool(null);
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

    try {
      // Call API with SSE streaming
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage: Message | null = null;
      // eslint-disable-next-line prefer-const
      let toolsUsed: string[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'status') {
              if (data.status === 'thinking') {
                setStatus('thinking');
                setCurrentTool(null);
              } else if (data.status === 'using_tool') {
                setStatus('using_tool');
                setCurrentTool(data.toolName || null);
                if (data.toolName) {
                  toolsUsed.push(data.toolName);
                }
              } else if (data.status === 'generating') {
                setStatus('generating');
                setCurrentTool(null);
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
              // Add error message
              assistantMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${data.error}`,
                timestamp: new Date(),
              };
            }
          }
        }
      }

      // Add assistant message
      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage!]);

        // Invalidate RTK Query cache if mutating tools were used
        const mutatingTools = ['create-goal', 'update-goal', 'delete-goal', 'create-task', 'complete-task', 'update-task', 'add-substep', 'complete-substep', 'update-goal-icon', 'delete-task', 'delete-substep', 'update-profile', 'remove-friend', 'create-invitation'];
        if (toolsUsed.some((tool) => mutatingTools.includes(tool))) {
          dispatch(goalsApi.util.invalidateTags(['Goal']));
          dispatch(streaksApi.util.invalidateTags(['Streak']));
        }

        if (toolsUsed.some((tool) => ['get-friends', 'remove-friend', 'create-invitation'].includes(tool))) {
          dispatch(friendsApi.util.invalidateTags(['Friend']));
        }
      }

      setStatus('idle');
      setCurrentTool(null);
    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setStatus('idle');
      setCurrentTool(null);
    }
  }, [messages, dispatch]);

  return {
    messages,
    status,
    currentTool,
    sendMessage,
    clearMessages,
    isOpen,
    toggleOpen,
  };
}
