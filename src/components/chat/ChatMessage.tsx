/**
 * Chat message component
 */

import { Message } from '@/types/agent';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // System messages: compact tool-log in a muted container
  if (message.role === 'system') {
    return (
      <div className="mb-3 px-3">
        <div className="bg-surface-hover rounded-md px-3 py-2 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-text-muted">🔧 Tools executed</span>
          </div>
          <div className="whitespace-pre-wrap text-xs text-text-secondary font-mono">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-brand-primary text-white'
            : 'bg-surface-hover text-text-primary'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
        {message.toolUsed && (
          <div className="mt-2 text-xs opacity-70">
            <span className="font-semibold">Tool:</span> {message.toolUsed}
          </div>
        )}
        <div className="mt-1 text-xs opacity-70">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
