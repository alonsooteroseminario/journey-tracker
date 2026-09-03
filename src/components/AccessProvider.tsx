"use client";

import { createContext, useContext } from "react";

/**
 * Whether the current user gets the full Cadence app (true) or the
 * standalone Prompt Wallet (false).
 *
 * Defaults to `true` so components rendered without a provider — which is
 * every existing unit test — behave exactly as they did before roles existed.
 */
const AccessContext = createContext(true);

export function AccessProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useFullAccess(): boolean {
  return useContext(AccessContext);
}
