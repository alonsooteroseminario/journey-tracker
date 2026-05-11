"use client";

import { useEffect } from "react";
import { ReduxProvider } from "@/store/provider";
import { AutoMigration } from "@/components/AutoMigration";
import { TimezoneSync } from "@/components/TimezoneSync";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { UndoToastProvider } from "@/components/undo/UndoToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

/**
 * AppShell - Client-side wrapper that provides Redux + auto-migration.
 * Placed inside ClerkProvider (server component in layout.tsx).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try { localStorage.removeItem('chat-widget-position'); } catch { /* ignore */ }
  }, []);

  return (
    <ReduxProvider>
      <ThemeProvider>
        <AutoMigration />
        <TimezoneSync />
        <UndoToastProvider>
          {children}
          <ChatWidget />
        </UndoToastProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
