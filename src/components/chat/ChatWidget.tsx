/**
 * Chat widget – draggable floating chat button + panel
 *
 * Interactions (closed button):
 *   Click (any device)        – opens chat instantly
 *   Hold 1 s without moving   – ripple ring builds → drag mode activates
 *   Move after drag activates – button follows the pointer, sticks on release
 *
 * Position persists in localStorage.
 * Panel anchors near the button; < 640 px viewport → full-width sheet at the bottom.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatStatusIndicator } from './ChatStatusIndicator';

/* ------------------------------------------------------------------ constants */
const BUTTON_SIZE = 56;
const STORAGE_KEY = 'chat-widget-position';
const HOLD_MS = 1000; // hold duration before drag activates
const MOVE_CANCEL_PX = 8; // movement while holding cancels the hold
const PANEL_MAX_W = 400;
const PANEL_MAX_H = 600;

/* --------------------------------------------------------------- helpers */
function clampToViewport(x: number, y: number, vw: number, vh: number) {
  return {
    x: Math.max(0, Math.min(x, vw - BUTTON_SIZE)),
    y: Math.max(0, Math.min(y, vh - BUTTON_SIZE)),
  };
}

function loadSavedPosition(vw: number, vh: number): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return clampToViewport(saved.x, saved.y, vw, vh);
    }
  } catch {
    // ignore
  }
  return { x: 16, y: 12 };
}

/* ------------------------------------------------------------ component */
export function ChatWidget() {
  const { messages, status, currentTool, processingLog, sendMessage, clearMessages, isOpen, toggleOpen } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* --- layout state --- */
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  /* --- interaction state --- */
  const [holding, setHolding] = useState(false); // pointer is down, waiting for hold
  const [dragging, setDragging] = useState(false); // actively moving the button
  const [dragReady, setDragReady] = useState(false); // hold timer fired, drag armed

  /* refs for use inside pointer callbacks */
  const posRef = useRef(position);
  const dragReadyRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const didDrag = useRef(false);
  const vpRef = useRef(vp);

  useEffect(() => { posRef.current = position; }, [position]);
  useEffect(() => { dragReadyRef.current = dragReady; }, [dragReady]);
  useEffect(() => { vpRef.current = vp; }, [vp]);

  /* --- initialise on client --- */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setVp({ w, h });
    setPosition(loadSavedPosition(w, h));
    setInitialized(true);
  }, []);

  /* --- clamp on resize --- */
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setVp({ w, h });
      setPosition((p) => clampToViewport(p.x, p.y, w, h));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* --- auto-scroll messages --- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* --- cleanup timer on unmount --- */
  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    []
  );

  /* ---------------------------------------------------------- pointer handlers */
  const resetInteraction = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    dragOrigin.current = null;
    didDrag.current = false;
    setHolding(false);
    setDragging(false);
    setDragReady(false);
    dragReadyRef.current = false;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isOpen) return;
      e.preventDefault();
      didDrag.current = false;
      dragOrigin.current = {
        mx: e.clientX,
        my: e.clientY,
        px: posRef.current.x,
        py: posRef.current.y,
      };
      buttonRef.current?.setPointerCapture(e.pointerId);

      /* start the hold timer – same for mouse and touch */
      setHolding(true);
      holdTimer.current = setTimeout(() => {
        setDragReady(true);
        dragReadyRef.current = true;
      }, HOLD_MS);
    },
    [isOpen]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragOrigin.current) return;
      const dx = e.clientX - dragOrigin.current.mx;
      const dy = e.clientY - dragOrigin.current.my;

      if (!dragReadyRef.current) {
        // moved too much before hold completed → cancel hold entirely
        if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) resetInteraction();
        return;
      }

      /* hold fired – we are now dragging */
      didDrag.current = true;
      setDragging(true);
      setHolding(false);

      const { w, h } = vpRef.current;
      setPosition(clampToViewport(dragOrigin.current.px + dx, dragOrigin.current.py + dy, w, h));
    },
    [resetInteraction]
  );

  const onPointerUp = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (!didDrag.current) {
      // no drag happened → it was a click → toggle chat
      toggleOpen();
    } else {
      // persist position
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current));
      } catch {
        // ignore
      }
    }

    dragOrigin.current = null;
    didDrag.current = false;
    setHolding(false);
    setDragging(false);
    setDragReady(false);
    dragReadyRef.current = false;
  }, [toggleOpen]);

  /* -------------------------------------------------------- early return */
  if (!initialized) return null;

  /* -------------------------------------------------------- closed state */
  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 50,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
        }}
      >
        {/* keyframes for the hold-ripple ring */}
        <style>{`
          @keyframes chatHoldRipple {
            0%   { transform: scale(1);   opacity: 0.55; }
            100% { transform: scale(1.75); opacity: 0; }
          }
        `}</style>

        {/* ripple ring – visible while the user is holding, disappears once drag starts or is cancelled */}
        {holding && !dragging && (
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
            style={{ animation: `chatHoldRipple ${HOLD_MS / 1000}s ease-out forwards` }}
          />
        )}

        {/* the actual button */}
        <button
          ref={buttonRef}
          style={{
            cursor: dragging ? 'grabbing' : 'pointer',
            /* scale pulse the moment drag is armed (after hold) */
            transform: dragReady && !dragging ? 'scale(1.15)' : 'scale(1)',
            transition: dragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow:
              dragReady && !dragging
                ? '0 0 0 4px rgba(59,130,246,0.5), 0 4px 6px -1px rgba(0,0,0,0.15)'
                : undefined,
            touchAction: 'none',
          }}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={resetInteraction}
          aria-label="Open chat"
        >
          {/* bot face icon – same shape as favicon (icon.svg) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
          >
            {/* antenna dot */}
            <circle cx="12" cy="1.2" r="1" fill="currentColor" stroke="none" />
            {/* antenna stem */}
            <line x1="12" y1="2.2" x2="12" y2="4.2" />
            {/* head */}
            <rect x="3" y="4.2" width="18" height="11.5" rx="4" />
            {/* eyes */}
            <circle cx="8.5" cy="9.8" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="9.8" r="1.2" fill="currentColor" stroke="none" />
            {/* smile */}
            <path d="M8.5 12.8Q12 14.8 15.5 12.8" />
          </svg>
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------- open state */
  const isMobile = vp.w < 640;
  let panelW: number;
  let panelH: number;
  let panelLeft: number;
  let panelTop: number;

  if (isMobile) {
    panelW = vp.w;
    panelH = Math.min(PANEL_MAX_H, vp.h * 0.85);
    panelLeft = 0;
    panelTop = vp.h - panelH;
  } else {
    panelW = Math.min(PANEL_MAX_W, vp.w - 16);
    panelH = Math.min(PANEL_MAX_H, vp.h * 0.8);

    panelTop = position.y - panelH - 12;
    if (panelTop < 8) {
      panelTop = position.y + BUTTON_SIZE + 12;
      if (panelTop + panelH > vp.h - 8) panelTop = 8;
    }

    panelLeft = position.x + BUTTON_SIZE - panelW;
    if (panelLeft < 8) panelLeft = 8;
    if (panelLeft + panelW > vp.w - 8) panelLeft = vp.w - panelW - 8;
  }

  return (
    <>
      {/* floating close button at the stored position */}
      <button
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 51 }}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
        onClick={toggleOpen}
        aria-label="Close chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* chat panel */}
      <div
        style={{
          position: 'fixed',
          left: panelLeft,
          top: panelTop,
          width: panelW,
          height: panelH,
          zIndex: 50,
        }}
        className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-500 text-white rounded-t-lg">
          <h3 className="font-semibold">Journey Tracker Assistant</h3>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
                aria-label="Clear messages"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={toggleOpen}
              className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
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

        {/* input */}
        <ChatInput onSend={sendMessage} disabled={status !== 'idle'} />
      </div>
    </>
  );
}
