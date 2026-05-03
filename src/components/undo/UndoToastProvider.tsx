"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export interface ShowUndoToastArgs {
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastContextValue {
  showUndoToast: (args: ShowUndoToastArgs) => void;
}

interface ToastState {
  message: string;
  onUndo: () => void;
  totalMs: number;
}

const UndoToastContext = createContext<UndoToastContextValue | null>(null);

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [progress, setProgress] = useState(100);

  // Refs for timer management — never stale since only refs are accessed
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingMsRef = useRef(0);
  const segmentStartRef = useRef(0);
  const totalMsRef = useRef(0);

  const clearTimers = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startSegment = (remaining: number) => {
    clearTimers();
    segmentStartRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - segmentStartRef.current;
      const r = Math.max(0, remaining - elapsed);
      setProgress((r / totalMsRef.current) * 100);
    }, 50);

    dismissTimerRef.current = setTimeout(() => {
      clearTimers();
      setToast(null);
      setProgress(100);
    }, remaining);
  };

  const showUndoToast = useCallback(
    ({ message, onUndo, durationMs = 6000 }: ShowUndoToastArgs) => {
      clearTimers();
      setProgress(100);
      remainingMsRef.current = durationMs;
      totalMsRef.current = durationMs;
      setToast({ message, onUndo, totalMs: durationMs });
      startSegment(durationMs);
    },
    // clearTimers and startSegment only use refs — stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const dismiss = useCallback(() => {
    clearTimers();
    setToast(null);
    setProgress(100);
  }, []);

  // Capture onUndo in ref so handleUndo doesn't need toast as dep
  const onUndoRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    onUndoRef.current = toast?.onUndo ?? null;
  }, [toast]);

  const handleUndo = useCallback(() => {
    const cb = onUndoRef.current;
    dismiss();
    cb?.();
  }, [dismiss]);

  const handleMouseEnter = useCallback(() => {
    if (!dismissTimerRef.current) return;
    const elapsed = Date.now() - segmentStartRef.current;
    remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
    clearTimers();
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (remainingMsRef.current > 0 && !dismissTimerRef.current) {
      startSegment(remainingMsRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global Esc key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismiss]);

  // Cleanup timers on unmount
  useEffect(() => clearTimers, []);

  return (
    <UndoToastContext.Provider value={{ showUndoToast }}>
      {children}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-72 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden motion-safe:animate-slide-up"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors whitespace-nowrap"
            >
              Undo
            </button>
          </div>
          <div className="h-0.5 bg-gray-700">
            <div
              className="h-full bg-brand-primary"
              style={{ width: `${progress}%`, transition: "width 50ms linear" }}
            />
          </div>
        </div>
      )}
    </UndoToastContext.Provider>
  );
}

export function useUndoToast(): UndoToastContextValue {
  const ctx = useContext(UndoToastContext);
  if (!ctx) throw new Error("useUndoToast must be used within UndoToastProvider");
  return ctx;
}
