"use client";

import { ReduxProvider } from "@/store/provider";
import { AutoMigration } from "@/components/AutoMigration";

/**
 * AppShell - Client-side wrapper that provides Redux + auto-migration.
 * Placed inside ClerkProvider (server component in layout.tsx).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AutoMigration />
      {children}
    </ReduxProvider>
  );
}
