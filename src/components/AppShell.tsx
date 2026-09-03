"use client";

import { useEffect } from "react";
import { ReduxProvider } from "@/store/provider";
import { AutoMigration } from "@/components/AutoMigration";
import { TimezoneSync } from "@/components/TimezoneSync";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { UndoToastProvider } from "@/components/undo/UndoToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { HeaderHost } from "@/components/HeaderHost";
import { AccessProvider } from "@/components/AccessProvider";

/**
 * AppShell - Client-side wrapper that provides Redux + auto-migration.
 * Placed inside ClerkProvider (server component in layout.tsx).
 */
export function AppShell({
  children,
  fullAccess = true,
}: {
  children: React.ReactNode;
  fullAccess?: boolean;
}) {
  useEffect(() => {
    try { localStorage.removeItem('chat-widget-position'); } catch { /* ignore */ }
  }, []);

  return (
    <ReduxProvider>
      <ThemeProvider>
        <AccessProvider value={fullAccess}>
          <AutoMigration />
          <TimezoneSync />
          <UndoToastProvider>
            <HeaderHost />
            {children}
            {fullAccess && <ChatWidget />}
          </UndoToastProvider>
        </AccessProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
