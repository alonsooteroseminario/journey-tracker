/**
 * ChatWidget — chat panel component
 *
 * Rendered globally via AppShell. The trigger button lives in Header.tsx.
 * Renders nothing when closed. When open, shows in one of two view modes:
 *
 *   floating — fixed overlay, top-right, below the app header
 *   split    — fixed full-width bottom panel (45 vh); body gets matching padding-bottom
 *
 * View mode is stored in Redux chatSlice and toggled via a button in the panel header.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setViewMode } from '@/store/slices/chatSlice';
import type { ChatViewMode } from '@/store/slices/chatSlice';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatStatusIndicator } from './ChatStatusIndicator';

const HEADER_HEIGHT = 88; // px — estimated sticky header height (two-row layout)
const SPLIT_HEIGHT_VH = 45;

export function ChatWidget() {
  const { messages, status, currentTool, processingLog, needsKey, sendMessage, clearMessages, toggleOpen } =
    useChat();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.chat.isOpen);
  const viewMode = useAppSelector((s) => s.chat.viewMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* auto-scroll to latest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* body padding-bottom for split mode so page content clears the panel */
  useEffect(() => {
    if (isOpen && viewMode === 'split') {
      document.body.style.paddingBottom = `${SPLIT_HEIGHT_VH}vh`;
    } else {
      document.body.style.paddingBottom = '';
    }
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [isOpen, viewMode]);

  /* render nothing when closed */
  if (!isOpen) return null;

  /* panel position */
  const isSplit = viewMode === 'split';
  const panelStyle: React.CSSProperties = isSplit
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, height: `${SPLIT_HEIGHT_VH}vh`, zIndex: 50 }
    : {
        position: 'fixed',
        top: HEADER_HEIGHT + 8,
        right: 16,
        width: 'min(400px, calc(100vw - 32px))',
        height: 'min(600px, calc(100vh - 120px))',
        zIndex: 50,
      };

  const nextMode: ChatViewMode = isSplit ? 'floating' : 'split';
  const toggleLabel = isSplit ? 'Switch to floating view' : 'Switch to split view';

  return (
    <div
      style={panelStyle}
      className="flex flex-col bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 rounded-t-lg"
    >
      {/* panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-primary text-white rounded-t-lg flex-shrink-0">
        <h3 className="font-semibold text-sm sm:text-base">Journey Tracker Assistant</h3>
        <div className="flex gap-1">
          {/* view mode toggle */}
          <button
            onClick={() => dispatch(setViewMode(nextMode))}
            className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {isSplit ? (
              /* floating icon — arrows pointing inward (compress) */
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            ) : (
              /* split icon — horizontal split lines */
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>

          {/* clear messages */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
              aria-label="Clear messages"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}

          {/* close */}
          <button
            onClick={toggleOpen}
            className="text-white hover:bg-brand-secondary rounded p-1 transition-colors"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="mb-4">Hi! I&apos;m your Journey Tracker assistant.</p>
            <p className="text-sm">Ask me about your goals, tasks, or streaks!</p>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <ChatStatusIndicator status={status} toolName={currentTool} processingLog={processingLog} />
        <div ref={messagesEndRef} />
      </div>

      {/* Gate banner when no API key is set */}
      {needsKey && (
        <div className="mx-3 mb-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-center justify-between gap-2">
          <span>🔑 Add your Anthropic API key to chat</span>
          <a
            href="/settings/ai-key"
            className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
          >
            Go to Settings
          </a>
        </div>
      )}

      {/* input */}
      <ChatInput onSend={sendMessage} disabled={status !== 'idle' || needsKey} />
    </div>
  );
}
