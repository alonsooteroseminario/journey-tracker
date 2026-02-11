/**
 * Admin chat hook for marketing agent
 * Similar to useChat but for admin-only tools
 */

import { useState, useCallback, useRef } from "react";
import { Message } from "@/types/agent";

export type AdminChatStatus = "idle" | "thinking" | "using_tool" | "generating";

export function useAdminChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AdminChatStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStatus("thinking");

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/admin/agent/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            stream: true,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "status") {
                  setStatus(data.status);
                } else if (data.type === "response") {
                  // Add assistant response
                  const assistantMessage: Message = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: data.content,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStatus("idle");
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error("Failed to parse SSE message:", parseError);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.log("Request aborted");
          } else {
            console.error("Chat error:", error);
            // Add error message
            const errorMessage: Message = {
              id: Date.now().toString(),
              role: "system",
              content: error.message || "Failed to send message. Please try again.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        }
        setStatus("idle");
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading]
  );

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStatus("idle");
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus("idle");
  }, []);

  return {
    messages,
    status,
    isLoading,
    sendMessage,
    cancelRequest,
    clearMessages,
  };
}
