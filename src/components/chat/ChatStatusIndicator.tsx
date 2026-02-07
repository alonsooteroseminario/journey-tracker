/**
 * Chat status indicator – shows processing state and a live tool-call log
 */

import { ChatStatus, ProcessingEvent } from '@/hooks/useChat';

interface ChatStatusIndicatorProps {
  status: ChatStatus;
  toolName?: string | null;
  processingLog?: ProcessingEvent[];
}

export function ChatStatusIndicator({ status, toolName, processingLog = [] }: ChatStatusIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
      {/* Live tool-call log */}
      {processingLog.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {processingLog.map((event, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className={event.success === null ? 'text-blue-500' : event.success ? 'text-green-600' : 'text-red-500'}>
                {event.success === null ? '⟳' : event.success ? '✓' : '✗'}
              </span>
              <code className="text-gray-700 dark:text-gray-300">{event.toolName}</code>
              {event.inputSummary && (
                <span className="text-gray-400 dark:text-gray-500">{`{${event.inputSummary}}`}</span>
              )}
              {event.resultSummary && (
                <span className="text-gray-500 dark:text-gray-400">→ {event.resultSummary}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouncing dots + current status text */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>
          {status === 'thinking' && 'Thinking...'}
          {status === 'using_tool' && toolName && `Running ${toolName}...`}
          {status === 'using_tool' && !toolName && 'Running tool...'}
          {status === 'generating' && 'Generating response...'}
        </span>
      </div>
    </div>
  );
}
