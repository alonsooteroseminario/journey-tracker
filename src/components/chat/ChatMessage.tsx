/**
 * Chat message component
 */

import { Message } from '@/types/agent';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
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
