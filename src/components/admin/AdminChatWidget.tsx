"use client";

import { useAdminChat } from "@/hooks/useAdminChat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStatusIndicator } from "@/components/chat/ChatStatusIndicator";
import { useEffect, useRef } from "react";

export function AdminChatWidget() {
  const { messages, status, isLoading, sendMessage, cancelRequest, clearMessages } =
    useAdminChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-surface border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-lg">Marketing Assistant</h3>
          <p className="text-sm text-text-secondary">
            AI-powered campaign and content management
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-sm text-text-secondary hover:text-text-primary px-3 py-1 rounded border hover:bg-surface-muted"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            <div className="text-4xl mb-4">💼</div>
            <h4 className="font-medium text-lg mb-2">Welcome to Marketing Assistant</h4>
            <p className="text-sm">
              I can help you create campaigns, generate social media content, and manage your
              marketing strategy.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="font-medium">Try asking:</p>
              <ul className="space-y-1 text-left max-w-md mx-auto">
                <li className="text-text-secondary">&bull; "Create a Twitter campaign for Q1"</li>
                <li className="text-text-secondary">
                  &bull; "Generate a post celebrating 100 users"
                </li>
                <li className="text-text-secondary">&bull; "Show me my active campaigns"</li>
                <li className="text-text-secondary">
                  &bull; "Create motivational content for Instagram"
                </li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}

        {status !== "idle" && (
          <div className="flex items-center gap-2 text-text-secondary">
            <ChatStatusIndicator status={status} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
