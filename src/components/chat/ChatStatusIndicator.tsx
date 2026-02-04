/**
 * Chat status indicator component
 */

import { ChatStatus } from '@/hooks/useChat';

interface ChatStatusIndicatorProps {
  status: ChatStatus;
  toolName?: string | null;
}

export function ChatStatusIndicator({ status, toolName }: ChatStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {status === 'thinking' && 'Thinking...'}
        {status === 'using_tool' && toolName && `Using ${toolName}...`}
        {status === 'using_tool' && !toolName && 'Using tool...'}
        {status === 'generating' && 'Generating response...'}
      </span>
    </div>
  );
}
