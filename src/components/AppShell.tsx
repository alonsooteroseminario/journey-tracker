"use client";

import { ReduxProvider } from "@/store/provider";
import { AutoMigration } from "@/components/AutoMigration";
import { ChatWidget } from "@/components/chat/ChatWidget";

/**
 * AppShell - Client-side wrapper that provides Redux + auto-migration.
 * Placed inside ClerkProvider (server component in layout.tsx).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AutoMigration />
      {children}
      <ChatWidget />
    </ReduxProvider>
  );
}
